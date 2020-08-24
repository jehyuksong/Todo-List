const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { request } = require("express");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-jehyuk:asdf1234@cluster0.ksfes.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "반갑습니다!",
});

const item2 = new Item({
  name: "+ 버튼을 누르면 할 일을 등록할 수 있어요!",
});

const item3 = new Item({
  name: "<- 체크박스를 클릭하면 사라집니다!",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (!foundItems.length) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Added Items to DB!!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "오늘", newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const requestedTitle = _.capitalize(req.params.customListName);

  List.findOne({ name: requestedTitle }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: requestedTitle,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + requestedTitle);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "오늘") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "오늘") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("successfully removed checked item!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
