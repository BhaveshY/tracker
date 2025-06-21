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
  initializeRoadmapData();
});

function initializeRoadmapData() {
  const roadmapData = [
    {
      month: 1,
      title: "Fundamentals – Regression & Classification",
      description: "Build foundation with regression and classification projects",
      projects: [
        {
          title: "House Price Predictor",
          description: "Linear regression model with Streamlit deployment",
          type: "regression",
          tech_stack: "Python, Pandas, scikit-learn, Streamlit"
        },
        {
          title: "Iris Flower Classifier",
          description: "Multi-class classification with logistic regression",
          type: "classification",
          tech_stack: "Python, scikit-learn, Streamlit"
        }
      ],
      resources: [
        { title: "DataCamp – Sklearn Linear Regression", url: "https://www.datacamp.com", type: "tutorial" },
        { title: "DataCamp – Logistic Regression Tutorial", url: "https://www.datacamp.com", type: "tutorial" },
        { title: "Machine Learning Mastery – Deploy Models with Streamlit", url: "https://machinelearningmastery.com", type: "tutorial" }
      ]
    },
    {
      month: 2,
      title: "Computer Vision – Image Classification",
      description: "Build CNN models and learn transfer learning",
      projects: [
        {
          title: "Basic Image Classifier (CNN)",
          description: "CNN for CIFAR-10 or Fashion-MNIST classification",
          type: "computer_vision",
          tech_stack: "Python, TensorFlow/Keras, Streamlit"
        },
        {
          title: "Advanced CV (Transfer Learning)",
          description: "Fine-tune pre-trained models or object detection",
          type: "computer_vision",
          tech_stack: "PyTorch, TorchVision, OpenCV"
        }
      ],
      resources: [
        { title: "PyTorch Tutorial – Training a Classifier", url: "https://pytorch.org", type: "tutorial" },
        { title: "DataCamp – Intro to CNNs", url: "https://www.datacamp.com", type: "tutorial" }
      ]
    },
    {
      month: 3,
      title: "Natural Language Processing (NLP)",
      description: "Work with transformers and text processing",
      projects: [
        {
          title: "Sentiment Analysis with BERT",
          description: "Fine-tune BERT for sentiment classification",
          type: "nlp",
          tech_stack: "Python, HuggingFace, PyTorch"
        },
        {
          title: "Text Summarizer or Chatbot",
          description: "Build summarization or Q&A system",
          type: "nlp",
          tech_stack: "HuggingFace, Flask/Streamlit"
        }
      ],
      resources: [
        { title: "KDnuggets – Fine-tuning BERT for Sentiment", url: "https://www.kdnuggets.com", type: "tutorial" },
        { title: "Hugging Face Tutorial (Sentiment Analysis)", url: "https://huggingface.co", type: "tutorial" }
      ]
    },
    {
      month: 4,
      title: "Recommender Systems",
      description: "Build collaborative and content-based recommenders",
      projects: [
        {
          title: "Movie Recommender (Collaborative Filtering)",
          description: "Matrix factorization with MovieLens dataset",
          type: "recommender",
          tech_stack: "Python, Surprise library, Pandas"
        },
        {
          title: "Content-Based Recommender",
          description: "TF-IDF based item similarity system",
          type: "recommender",
          tech_stack: "scikit-learn, Pandas"
        }
      ],
      resources: [
        { title: "RealPython – Collaborative Filtering Tutorial", url: "https://realpython.com", type: "tutorial" },
        { title: "Surprise Library Guide", url: "https://surprise.readthedocs.io", type: "documentation" }
      ]
    },
    {
      month: 5,
      title: "Advanced/Integration Projects",
      description: "Advanced models and system integration",
      projects: [
        {
          title: "Object Detection App",
          description: "YOLO or Faster R-CNN based detection system",
          type: "computer_vision",
          tech_stack: "PyTorch, OpenCV, Streamlit"
        },
        {
          title: "AI Chatbot Integration",
          description: "LLM-powered conversational interface",
          type: "nlp",
          tech_stack: "OpenAI API, Flask/Streamlit"
        }
      ],
      resources: [
        { title: "PyTorch Detection Tutorial", url: "https://pytorch.org", type: "tutorial" },
        { title: "DataCamp – Using GPT via OpenAI API", url: "https://www.datacamp.com", type: "tutorial" }
      ]
    },
    {
      month: 6,
      title: "Capstone & Portfolio Polish",
      description: "Full-stack integration and portfolio enhancement",
      projects: [
        {
          title: "Full-Stack AI Web App",
          description: "Multi-modal AI assistant with integrated capabilities",
          type: "integration",
          tech_stack: "FastAPI/Flask, React, Docker"
        },
        {
          title: "GitHub & Resume Enhancement",
          description: "Portfolio optimization and job preparation",
          type: "portfolio",
          tech_stack: "GitHub Pages, Documentation tools"
        }
      ],
      resources: [
        { title: "DataCamp – CI/CD for Machine Learning", url: "https://www.datacamp.com", type: "tutorial" },
        { title: "Analytics Vidhya – Heroku Deployment Guide", url: "https://www.analyticsvidhya.com", type: "tutorial" }
      ]
    }
  ];

  // Insert months and projects
  roadmapData.forEach((monthData) => {
    db.run('INSERT OR IGNORE INTO months (month_number, title, description) VALUES (?, ?, ?)',
      [monthData.month, monthData.title, monthData.description], function(err) {
        if (err) return;
        
        const monthId = this.lastID;
        
        // Insert projects for this month
        monthData.projects.forEach((project) => {
          const projectId = uuidv4();
          db.run('INSERT OR IGNORE INTO projects (id, month_id, title, description, type, tech_stack) VALUES (?, ?, ?, ?, ?, ?)',
            [projectId, monthData.month, project.title, project.description, project.type, project.tech_stack]);
        });

        // Insert learning resources
        monthData.resources.forEach((resource) => {
          const resourceId = uuidv4();
          db.run('INSERT OR IGNORE INTO learning_resources (id, month_id, title, url, type) VALUES (?, ?, ?, ?, ?)',
            [resourceId, monthData.month, resource.title, resource.url, resource.type]);
        });
      });
  });
}

// API Routes

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
  const { status, github_url, deployment_url, documentation_status, progress_percentage } = req.body;
  
  db.run(`
    UPDATE projects 
    SET status = ?, github_url = ?, deployment_url = ?, documentation_status = ?, progress_percentage = ?
    WHERE id = ?
  `, [status, github_url, deployment_url, documentation_status, progress_percentage, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Project updated successfully' });
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

app.listen(PORT, () => {
  console.log(`🚀 ML/AI Roadmap Tracker server running on port ${PORT}`);
}); 