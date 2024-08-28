const express = require("express");
const cors = require("cors");
const { v4: uuidv4, validate: uuidValidate } = require("uuid");
// const { validate: uuidValidate } = require("uuid");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;
const db = require("./studentsDB.js");

app.use(express.json());

//CORS implementation
const corsOptions = {
    origin: "http://127.0.0.1:5500",
    // origin: "*",
    // methods: "GET",
    optionSuccessStatus: 200,
};

const corsOptionsUniquePort = {
    origin: "http://127.0.0.1:9999",
    // origin: "*",
    methods: "GET",
    optionSuccessStatus: 200,
};

// CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
// Ensures that the server responds to preflight requests for all routes
app.options("*", cors(corsOptions));

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Express API",
            version: "1.0.0",
            description:
                "Nicolas Lopez - Laneway Ed: Term 3 - 2024 - Express API REST",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["app.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//UUID
app.get("/uuid", (req, res) => {
    res.status(200).send({ uuid: uuidv4() });
});

// Validate UUID
app.get("/uuid/:id", (req, res) => {
    try {
        const isValid = uuidValidate(req.params.id);
        res.status(200).send({ isValid: isValid });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ERROR: error });
    }
});

// Check API KEY
const apiKey = "abc123";
const checkApiKey = (req, res, next) => {
    const userApiKey = req.header("x-api-key");
    if (userApiKey === apiKey) {
        next();
    } else {
        res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }
};

// endpoint
/**
 * @swagger
 * /students:
 *   get:
 *     summary: Retrieve a list of all students
 *     responses:
 *       200:
 *         description: A list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   created_at:
 *                     type: string
 */
app.get("/student/1", checkApiKey, (req, res) => {
    res.send({ message: "Hi, I'm student 1" });
});

// Example route to retrieve data from the database
app.get("/students", (req, res) => {
    db.database.all("SELECT * FROM students", (err, rows) => {
        if (err) {
            res.status(500).json({
                error: "Error fetching data from the database",
            });
        } else {
            res.json(rows);
        }
    });
});

app.get("/students/:id", cors(corsOptionsUniquePort), (req, res) => {
    const id = req.params.id;
    db.database.all("SELECT * FROM students WHERE id = ?", id, (err, rows) => {
        if (err) {
            res.status(500).json({
                error: "Error fetching data from the database",
            });
        } else if (rows.length === 0) {
            res.status(404).json({
                message: `Student with ID ${id} not found.`,
            });
        } else {
            res.json(rows).status(200);
        }
    });
});

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
app.post("/students", (req, res) => {
    db.database.run(
        `INSERT INTO students(name) VALUES(?)`,
        req.body.name,
        function (err) {
            if (err) {
                res.status(500).json({
                    error: "Error pushing data to the database",
                });
                return console.log(err.message);
            }
            // get the last insert id
            res.status(201).json({
                message: `Student created with ID: ${this.lastID}`,
            });
            console.log(`A row has been inserted with row id ${this.lastID}`);
        }
    );
});

app.patch("/students/:id", (req, res) => {
    const id = req.params.id;
    const newName = req.body.name;
    db.database.run(
        "UPDATE students SET name = ? WHERE id = ?",
        [newName, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0)
                return res.status(404).json({
                    message: `Student (ID: ${id}) not found`,
                    changes: this.changes,
                });
            res.json({
                message: `User with id ${id} updated`,
                changes: this.changes,
            });
        }
    );
});

app.put("/students/:id", checkApiKey, (req, res) => {
    const id = req.params.id;
    const newName = req.body.name;
    const newTimestamp = req.body.timestamp;
    db.database.run(
        "UPDATE students SET name = ?, created_at = ? WHERE id = ?",
        [newName, newTimestamp, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0)
                return res.status(404).json({
                    message: `Student (ID: ${id}) not found`,
                    changes: this.changes,
                });
            res.json({
                message: `User with id ${id} updated`,
                timestamp_created_at: "CHANGED!",
                changes: this.changes,
            });
        }
    );
});

app.delete("/students/:id", (req, res) => {
    const id = req.params.id;
    db.database.run("DELETE FROM students WHERE id = ?", id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0)
            return res.status(404).json({
                message: `Student (ID: ${id}) not found`,
                changes: this.changes,
            });
        res.json({
            message: `User with id ${id} deleted`,
            changes: this.changes,
        });
    });
});

// Server listening
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
