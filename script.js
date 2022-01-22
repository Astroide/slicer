import { parseObj } from "./objparser.js";
let obj = parseObj('./box.obj');
obj.then(function (obj) {
    console.log(obj);
});