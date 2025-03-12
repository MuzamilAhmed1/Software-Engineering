const express = require("express");
const db = require("./services/db"); // Database connection
const path = require("path");

const app = express();

// Set view engine to PUG
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, images)
app.use(express.static("public"));

// Homepage Route
app.get("/", async (req, res) => {
  try {
    // Fetch 4 featured recipes from the database
    const recipes = await db.query("SELECT * FROM recipes LIMIT 4");
    res.render("home", { recipes });
  } catch (error) {
    console.error("Error loading homepage:", error);
    res.status(500).send("Error loading homepage");
  }
});

// Recipes Route with Category Filtering
app.get("/recipes", async (req, res) => {
  try {
    // Fetch all categories for dynamic category tabs
    const categories = await db.query("SELECT * FROM categories");

    let query = `
      SELECT recipes.*, categories.name AS category_name 
      FROM recipes 
      JOIN categories ON recipes.category_id = categories.id
    `;

    const category = req.query.category;
    let params = [];
    let selectedCategory = "All Recipes"; // Default category title

    // Apply category filter if a valid category is provided
    if (category) {
      query += " WHERE categories.name = ?";
      params.push(category);
      selectedCategory = category; // Set category name dynamically
    }

    const recipes = await db.query(query, params);

    res.render("categories", { 
      recipes, 
      categories, 
      selectedCategory 
    });
  } catch (error) {
    console.error("Error loading recipes:", error);
    res.status(500).send("Error loading recipes");
  }
});

module.exports = app; // Export the Express app

// User Profile Page
app.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user info from the database
    const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    // Fetch recipes posted by this user
    const recipes = await db.query("SELECT * FROM recipes WHERE user_id = ?", [userId]);

    // If user not found, show 404 page
    if (user.length === 0) {
      return res.status(404).send("User not found");
    }

    res.render("profile", { user: user[0], recipes });
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).send("Error loading profile");
  }
});
