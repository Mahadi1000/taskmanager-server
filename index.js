require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://task-master-client-side.vercel.app",
    ],
    credentials: true,
  })
);

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run () {
  try {
    await client.connect();
    const db = await client.db("taskmaster");
    const tasksCollection = db.collection("tasks");

    console.log("Successfully connected to MongoDB!");

    app.get("/", (req, res) => {
      res.send("Task Master Server");
    });

    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await tasksCollection.find({}).toArray();
        res.json(tasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.post("/tasks", async (req, res) => {
      const newTask = { ...req.body, status: "pending" }; // Ensure status is always "pending" on creation

      try {
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json(result.ops[0]); // Return the newly created task
      } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      const taskId = req.params.id;

      try {
        const result = await tasksCollection.deleteOne({
          _id: new ObjectId(taskId),
        });
        if (result.deletedCount === 0) {
          res.status(404).json({ error: "Task not found" });
        } else {
          res.json({ message: "Task deleted successfully" });
        }
      } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      try {
        const result = await tasksCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { status } },
          { returnOriginal: false }
        );

        if (!result.value) {
          return res.status(404).json({ message: "Task not found" });
        }

        res.json(result.value);
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    app.patch("/tasks/:id", async (req, res) => {
      const taskId = req.params.id;
      const updatedTaskData = req.body;

      try {
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: updatedTaskData }
        );

        if (result.matchedCount === 0) {
          res.status(404).json({ error: "Task not found" });
        } else {
          res.json({ message: "Task updated successfully" });
        }
      } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      const taskId = req.params.id;

      try {
        if (!ObjectId.isValid(taskId)) {
          return res.status(400).json({ error: "Invalid task ID" });
        }

        const result = await tasksCollection.deleteOne({
          _id: new ObjectId(taskId),
        });
        if (result.deletedCount === 0) {
          res.status(404).json({ error: "Task not found" });
        } else {
          res.json({ message: "Task deleted successfully" });
        }
      } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

await client.db("admin").command({ ping: 1 });
console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Do not close the client connection in finally block
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Simple Task Manager Crud is running...");
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
