const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to mongoDB server
mongoose.connect("mongodb+srv://admin-cyrus:test123@cluster0.cj0xq.mongodb.net/todolistDB");

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const defaultItem1 = new Item({
  name: "Welcome to your Todo-List!"
});
const defaultItem2 = new Item({
  name: "Hit the + button to add a new item."
});
const defaultItem3 = new Item({
  name: "<-- Hit this to delete this item."
});

const defaultItems = [defaultItem1, defaultItem2, defaultItem3];

// create list schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) console.log(err);
        else console.log("Inserted default items to DB.");
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today", 
        newListItems: foundItems
      });
    }
  });
});

// dynamic route get method
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err) {
      if(!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    // we are in the default list
    Item.deleteOne({_id: checkedItemId}, function(err) {
      if(err) console.log(err);
      else console.log("Deleted Item Successfully!");
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err, foundList) {
        if(!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }

  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});