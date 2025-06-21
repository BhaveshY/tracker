const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'tracker.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Months table
  db.run(`CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_number INTEGER UNIQUE,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'not_started',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    month_id INTEGER,
    title TEXT,
    description TEXT,
    type TEXT,
    tech_stack TEXT,
    status TEXT DEFAULT 'not_started',
    github_url TEXT,
    deployment_url TEXT,
    documentation_status TEXT DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (month_id) REFERENCES months (id)
  )`);

  // Learning resources table
  db.run(`CREATE TABLE IF NOT EXISTS learning_resources (
    id TEXT PRIMARY KEY,
    month_id INTEGER,
    project_id TEXT,
    title TEXT,
    url TEXT,
    type TEXT,
    status TEXT DEFAULT 'not_started',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (month_id) REFERENCES months (id),
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Time logs table
  db.run(`CREATE TABLE IF NOT EXISTS time_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    date DATE,
    hours_spent REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Goals table
  db.run(`CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    type TEXT,
    target_value REAL,
    current_value REAL DEFAULT 0,
    target_date DATE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Initialize roadmap data

});


// API Routes

app.post('/api/smart-add', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text input is required' });
    }

    const operations = [];
    const createdItems = { projects: [], goals: [], tasks: [] };

    const processProjectBlock = (block) => {
        const project = {
            id: uuidv4(),
            title: '',
            description: '',
            month_id: null,
            type: 'uncategorized',
            tech_stack: '',
            status: 'not_started',
            documentation_status: 'not_started',
            progress_percentage: 0,
            github_url: '',
            deployment_url: '',
            tasks: []
        };
        
        const taskBlocks = block.split(/\n\s*Task:/i);
        const projectDetailsBlock = taskBlocks.shift().trim();
        
        const projectLines = projectDetailsBlock.split('\n');
        project.title = projectLines.shift().trim();

        projectLines.forEach(line => {
            const [key, ...v] = line.split(':');
            const value = v.join(':').trim();
            const keyLower = key.trim().toLowerCase();
            
            if (keyLower === 'description') project.description = value;
            else if (keyLower === 'month' || keyLower === 'month_id') project.month_id = parseInt(value, 10) || null;
            else if (keyLower === 'type') project.type = value.toLowerCase().replace(/\s+/g, '_');
            else if (keyLower === 'tech stack') project.tech_stack = value;
            else if (keyLower === 'status') project.status = value.toLowerCase().replace(/\s+/g, '_');
            else if (keyLower === 'github url') project.github_url = value;
            else if (keyLower === 'deployment url') project.deployment_url = value;
        });

        taskBlocks.forEach(taskBlock => {
            const taskLines = taskBlock.trim().split('\n');
            const task = {
                id: uuidv4(),
                project_id: project.id,
                title: taskLines.shift().trim(),
                description: '',
                status: 'todo',
                priority: 'medium',
                due_date: null
            };

            taskLines.forEach(line => {
                const [key, ...v] = line.split(':');
                const value = v.join(':').trim();
                const keyLower = key.trim().toLowerCase();

                if (keyLower === 'description') task.description = value;
                else if (keyLower === 'priority') task.priority = value.toLowerCase();
                else if (keyLower === 'due date') task.due_date = value;
                else if (keyLower === 'status') task.status = value.toLowerCase().replace(/\s+/g, '_');
            });
            project.tasks.push(task);
        });

        operations.push(callback => {
            db.run(
                `INSERT INTO projects (id, title, description, month_id, type, tech_stack, status, github_url, deployment_url, documentation_status, progress_percentage)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [project.id, project.title, project.description, project.month_id, project.type, project.tech_stack, project.status, project.github_url, project.deployment_url, project.documentation_status, project.progress_percentage],
                function (err) {
                    if (err) return callback(err);
                    createdItems.projects.push(project);
                    
                    const taskOps = project.tasks.map(task => 
                        (taskCallback) => db.run(
                            `INSERT INTO tasks (id, project_id, title, description, status, priority, due_date)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [task.id, task.project_id, task.title, task.description, task.status, task.priority, task.due_date],
                            function(err) {
                                if (err) return taskCallback(err);
                                createdItems.tasks.push(task);
                                taskCallback();
                            }
                        )
                    );

                    let completedTasks = 0;
                    if (taskOps.length === 0) return callback();
                    taskOps.forEach(op => op(err => {
                        if (err) return callback(err);
                        completedTasks++;
                        if (completedTasks === taskOps.length) {
                            callback();
                        }
                    }));
                }
            );
        });
    };

    const processGoalBlock = (block) => {
        const lines = block.trim().split('\n');
        const goal = {
            id: uuidv4(),
            title: lines.shift().trim(),
            description: '',
            type: 'learning',
            target_value: 1,
            current_value: 0,
            target_date: null,
            status: 'active'
        };

        lines.forEach(line => {
            const [key, ...v] = line.split(':');
            const value = v.join(':').trim();
            const keyLower = key.trim().toLowerCase();

            if (keyLower === 'description') goal.description = value;
            else if (keyLower === 'type') goal.type = value.toLowerCase().replace(/\s+/g, '_');
            else if (keyLower === 'target value') goal.target_value = parseFloat(value) || 1;
            else if (keyLower === 'target date') goal.target_date = value;
            else if (keyLower === 'status') goal.status = value.toLowerCase().replace(/\s+/g, '_');
        });

        operations.push(callback => {
            db.run(
                `INSERT INTO goals (id, title, description, type, target_value, current_value, target_date, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [goal.id, goal.title, goal.description, goal.type, goal.target_value, goal.current_value, goal.target_date, goal.status],
                function (err) {
                    if (err) return callback(err);
                    createdItems.goals.push(goal);
                    callback();
                }
            );
        });
    };

    const blocks = text.split(/\n\s*(?=Project:|Goal:)/i);
    blocks.forEach(block => {
        const trimmedBlock = block.trim();
        if (trimmedBlock.toLowerCase().startsWith('project:')) {
            processProjectBlock(trimmedBlock.substring('project:'.length));
        } else if (trimmedBlock.toLowerCase().startsWith('goal:')) {
            processGoalBlock(trimmedBlock.substring('goal:'.length));
        }
    });

    if (operations.length === 0) {
        return res.status(200).json({ message: 'No valid items found to add.' });
    }
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        let completedOps = 0;
        operations.forEach(op => {
            op((err) => {
                if (err) {
                    db.run("ROLLBACK");
                    console.error("Error during smart-add transaction:", err);
                    return res.status(500).json({ error: 'Failed to add items to database.', details: err.message });
                }
                completedOps++;
                if (completedOps === operations.length) {
                    db.run("COMMIT", (commitErr) => {
                         if (commitErr) {
                            console.error("Error committing transaction:", commitErr);
                            return res.status(500).json({ error: 'Failed to commit transaction.', details: commitErr.message });
                         }
                         res.status(201).json({ 
                            message: `${createdItems.projects.length} projects, ${createdItems.goals.length} goals, and ${createdItems.tasks.length} tasks added.`, 
                            createdItems 
                        });
                    });
                }
            });
        });
    });
});

// Get all months with their projects
app.get('/api/months', (req, res) => {
  db.all(`
    SELECT m.*, 
           COUNT(p.id) as total_projects,
           COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects
    FROM months m
    LEFT JOIN projects p ON m.month_number = p.month_id
    GROUP BY m.id
    ORDER BY m.month_number
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get specific month details
app.get('/api/months/:monthNumber', (req, res) => {
  const monthNumber = req.params.monthNumber;
  
  db.get('SELECT * FROM months WHERE month_number = ?', [monthNumber], (err, month) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!month) {
      res.status(404).json({ error: 'Month not found' });
      return;
    }

    // Get projects for this month
    db.all('SELECT * FROM projects WHERE month_id = ?', [monthNumber], (err, projects) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get learning resources for this month
      db.all('SELECT * FROM learning_resources WHERE month_id = ?', [monthNumber], (err, resources) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          ...month,
          projects,
          resources
        });
      });
    });
  });
});

// Get all projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY month_id, title', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/projects/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }
  
  const searchQuery = `%${q}%`;
  
  db.all(
    'SELECT * FROM projects WHERE title LIKE ? OR description LIKE ? ORDER BY month_id, title',
    [searchQuery, searchQuery],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Quick-add a new project with smart defaults
app.post('/api/projects/quick-add', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const id = uuidv4();
  let type = 'uncategorized';
  const description = 'Added via quick-add.';

  // Simple keyword-based type inference
  const titleLower = title.toLowerCase();
  if (titleLower.includes('classif')) type = 'classification';
  else if (titleLower.includes('regress') || titleLower.includes('predict')) type = 'regression';
  else if (titleLower.includes('vision') || titleLower.includes('image') || titleLower.includes('cnn')) type = 'computer_vision';
  else if (titleLower.includes('nlp') || titleLower.includes('text') || titleLower.includes('bert')) type = 'nlp';
  else if (titleLower.includes('recommend')) type = 'recommender';
  else if (titleLower.includes('portfolio') || titleLower.includes('deploy')) type = 'portfolio';
  else if (titleLower.includes('integra')) type = 'integration';
  
  // Find the lowest month_id or default to 1
  db.get('SELECT MIN(month_number) as min_month FROM months', (err, row) => {
    const month_id = row?.min_month || 1;

    db.run(
      'INSERT INTO projects (id, month_id, title, description, type) VALUES (?, ?, ?, ?, ?)',
      [id, month_id, title, description, type],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        db.get('SELECT * FROM projects WHERE id = ?', id, (err, projectRow) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.status(201).json(projectRow);
        });
      }
    );
  });
});


// Create a new project
app.post('/api/projects', (req, res) => {
  const { month_id, title, description, type, tech_stack } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO projects (id, month_id, title, description, type, tech_stack) VALUES (?, ?, ?, ?, ?, ?)',
    [id, month_id, title, description, type, tech_stack],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get('SELECT * FROM projects WHERE id = ?', id, (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, month_id, type, tech_stack, status, github_url, deployment_url, documentation_status, progress_percentage } = req.body;
  
  db.run(`
    UPDATE projects 
    SET title = ?, description = ?, month_id = ?, type = ?, tech_stack = ?, status = ?, github_url = ?, deployment_url = ?, documentation_status = ?, progress_percentage = ?
    WHERE id = ?
  `, [title, description, month_id, type, tech_stack, status, github_url, deployment_url, documentation_status, progress_percentage, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Project updated successfully' });
  });
});

// --- MILESTONES API ---

// Get dynamic milestones based on project completion
app.get('/api/milestones', (req, res) => {
  db.all(`
    SELECT 
      m.month_number,
      m.title,
      m.description,
      COUNT(p.id) as total_projects,
      COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects
    FROM months m
    JOIN projects p ON m.month_number = p.month_id
    GROUP BY m.id
    ORDER BY m.month_number
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const milestones = rows.map(row => ({
      month: row.month_number,
      title: row.title || `Month ${row.month_number} Completion`,
      description: row.description || `Finish all projects for Month ${row.month_number}`,
      completed: row.total_projects > 0 && row.total_projects === row.completed_projects
    }));
    res.json(milestones);
  });
});


// --- GOALS API ---

// Get all goals
app.get('/api/goals', (req, res) => {
  db.all('SELECT * FROM goals ORDER BY target_date', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a goal
app.post('/api/goals', (req, res) => {
  const { title, description, type, target_value, target_date } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO goals (id, title, description, type, target_value, target_date) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, description, type, target_value, target_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, ...req.body });
    }
  );
});

// Update a goal
app.put('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, type, target_value, current_value, target_date, status } = req.body;
  
  db.run(
    `UPDATE goals 
     SET title = ?, description = ?, type = ?, target_value = ?, current_value = ?, target_date = ?, status = ?
     WHERE id = ?`,
    [title, description, type, target_value, current_value, target_date, status, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Goal updated successfully' });
    }
  );
});

// Delete a goal
app.delete('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM goals WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

// --- TASKS API ---

// Get tasks for a project
app.get('/api/projects/:projectId/tasks', (req, res) => {
  const { projectId } = req.params;
  db.all('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const { project_id, title, description, priority, due_date } = req.body;
  const id = uuidv4();
  db.run(
    'INSERT INTO tasks (id, project_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)',
    [id, project_id, title, description, priority, due_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, ...req.body });
    }
  );
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const completed_at = status === 'completed' ? new Date().toISOString() : null;
  
  db.run(
    `UPDATE tasks 
     SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, completed_at = ?
     WHERE id = ?`,
    [title, description, status, priority, due_date, completed_at, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});


// Add time log
app.post('/api/time-logs', (req, res) => {
  const { project_id, date, hours_spent, description } = req.body;
  const id = uuidv4();
  
  db.run('INSERT INTO time_logs (id, project_id, date, hours_spent, description) VALUES (?, ?, ?, ?, ?)',
    [id, project_id, date, hours_spent, description], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, message: 'Time log added successfully' });
    });
});

// Get time logs for a project
app.get('/api/projects/:projectId/time-logs', (req, res) => {
  const { projectId } = req.params;
  
  db.all('SELECT * FROM time_logs WHERE project_id = ? ORDER BY date DESC', [projectId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  db.all(`
    SELECT 
      COUNT(DISTINCT p.id) as total_projects,
      COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
      COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) as in_progress_projects,
      COALESCE(SUM(tl.hours_spent), 0) as total_hours,
      COUNT(DISTINCT CASE WHEN lr.status = 'completed' THEN lr.id END) as completed_resources
    FROM projects p
    LEFT JOIN time_logs tl ON p.id = tl.project_id
    LEFT JOIN learning_resources lr ON p.month_id = lr.month_id
  `, (err, stats) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(stats[0]);
  });
});

// Update learning resource status
app.put('/api/learning-resources/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  db.run('UPDATE learning_resources SET status = ?, notes = ? WHERE id = ?', 
    [status, notes, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Learning resource updated successfully' });
    });
});

// --- LEARNING RESOURCES API ---

// Get learning resources
app.get('/api/learning-resources', (req, res) => {
  db.all('SELECT * FROM learning_resources ORDER BY month_id, title', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create a new learning resource
app.post('/api/learning-resources', (req, res) => {
  const { month_id, title, url, type, notes } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO learning_resources (id, month_id, title, url, type, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [id, month_id, title, url, type, notes],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get('SELECT * FROM learning_resources WHERE id = ?', id, (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(row);
      });
    }
  );
});

// Delete a learning resource
app.delete('/api/learning-resources/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM learning_resources WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

app.get('/api/resources/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const searchQuery = `%${q}%`;

  db.all(
    'SELECT * FROM learning_resources WHERE title LIKE ? OR notes LIKE ? OR type LIKE ? ORDER BY month_id, title',
    [searchQuery, searchQuery, searchQuery],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`🚀 Trackify server running on port ${PORT}`);
}); 