"use strict";

function pinnedChats_main() {
  window.addEventListener('load', function loadHandler(e) {
    window.removeEventListener('load', loadHandler);

    // The most sensible way to do this layout is to
    // wrap "content" in a stack.  That way we can
    // put things "above" "content" without worrying
    // about the rest of the layout.

    // This is likely to break a lot of assumptions
    // that are coded into addons, which is a bummer.

    try {
      var content = window.document.getElementById("content");
      var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      //var newStack = window.document.createElementNS(XUL_NS, "stack");
      //newStack.setAttribute("flex", 1);
      //newStack.setAttribute("id", "content-stack");
      // content.parentNode.insertBefore(newStack, content.parentNode.firstChild);
      
      //var chatBox = window.document.getElementById("pinnedchats");
      //newStack.appendChild(chatBox);      
      //newStack.appendChild(content);


    } catch (e) {
      dump("Error while creating the stack for content: " + e + "\n");
    }

    dump("Created the stack for content\n");
    addPinnedChat(); // while testing...

  });
}

function parsePx(value) {
  return parseInt(value.split("px")[0])
}

// Return an array of 4 booleans, indicating which of the 4 margins the
// specified coordinate is on.  Eg, a result of [true, true, false, false]
// indicates the coordinate of on both the top and left borders (ie, in the
// position where the top-left border could be resized)
function getWhichBorders(clientX, clientY, box) {
  let br = box.getBoundingClientRect()
  let effectiveX = clientX - br.left;
  let effectiveY = clientY - br.top;
  let boxWidth = br.right - br.left;
  let boxHeight = br.bottom - br.top;
//  dump("effectively " + effectiveX + "," + effectiveY + ", w,h=" + boxWidth + "," + boxHeight + "\n");
  let isLeft = effectiveX < parsePx(box.style.borderLeftWidth);
  let isTop = effectiveY < parsePx(box.style.borderTopWidth);
  let isRight = effectiveX > (boxWidth - parsePx(box.style.borderRightWidth));
  let isBottom = effectiveY > (boxHeight - parsePx(box.style.borderBottomWidth));
  dump("getWhichBorders: " + isLeft + "/" + isTop + "/" + isRight + "/" + isBottom + "\n");
  return [isLeft, isTop, isRight, isBottom];
}

function addPinnedChat() {
  var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  var container = window.document.getElementById("pinnedchats");

  var box = window.document.createElementNS(XUL_NS, "box");
  box.setAttribute("style", "width:200px;height:200px;background-color:white;border:4px solid #888;" +
      "margin-right:8px;border-top-left-radius:4px;border-top-right-radius:4px;" +
      "margin-top:-200px");

  box.setAttribute("mousethrough", "never");
  box.setAttribute("orient", "vertical");

  var titleBox = window.document.createElementNS(XUL_NS, "div");
  titleBox.setAttribute("orient", "horizontal");
  titleBox.setAttribute("style", "background-color:blue; cursor:default");
  var label = window.document.createElementNS(XUL_NS, "label");
  label.setAttribute("value", "The Title");
  label.setAttribute("flex", "1");
  titleBox.appendChild(label);
  // TODO: button etc elements for the titlebar.
  box.appendChild(titleBox);

  var browser = window.document.createElementNS(XUL_NS, "browser");
  //browser.setAttribute("src", "http://www.google.com")
  browser.setAttribute("src", "resource://browserpinnedchats/content/demo.htm")
  browser.setAttribute("style", "width:196px;padding-left:2px;padding-right:2px;height:100%");
  browser.setAttribute("flex", "1");
  box.appendChild(browser);

  let resizeDirections = {};
  let lastMoveX, lastMoveY;
  // to shrink, we would reduce the "height" and "margin-top" of "box" simultaneously

  container.appendChild(box);

  // listeners for moving.
  label.addEventListener("mousedown", function(evt) {
    if (evt.target != label) return;
    dump("mouse down in the label - starting move\n");
    let bcr = box.getBoundingClientRect()
    dump("box has bounding rect: " + bcr.left + "," + bcr.top + "\n");
    label.style.cursor = "move";
    box.style.position = "fixed";
    box.style.left = bcr.left + "px";
    box.style.top = bcr.top + "px";
    box.style.marginTop = "0px";
    label.setAttribute("moving", "true");
    label.setCapture(true);
    lastMoveX = evt.screenX;
    lastMoveY = evt.screenY;
    evt.stopPropagation();
  });
  label.addEventListener("mouseup", function(evt) {
    if (label.hasAttribute("moving")) {
      label.releaseCapture();
      label.removeAttribute("moving");
      dump("stopped moving\n");
    }
  });
  label.addEventListener("mousemove", function(evt) {
    if (evt.target != label || !label.hasAttribute("moving")) return;
    let offsetX = lastMoveX - evt.screenX;
    let offsetY = lastMoveY - evt.screenY;
    dump("Mouse move while moving: mouse is at client: " + evt.clientX + "," + evt.clientY + " - screen: " + evt.screenX + "," + evt.screenY + "\n");
    dump("Old box pos: " + box.style.left + ", " + box.style.top + "\n");
    box.style.left = (box.getBoundingClientRect().left - offsetX) + "px";
    box.style.top = (box.getBoundingClientRect().top - offsetY) + "px";
    dump("New box pos: " + box.style.left + ", " + box.style.top + "\n");
    lastMoveX = evt.screenX;
    lastMoveY = evt.screenY;
    // redrawing is screwed, but this doesn't help :(
/***    
    let windowUtils = window.QueryInterface(Ci.nsIInterfaceRequestor)
                      .getInterface(Ci.nsIDOMWindowUtils);
    windowUtils.redraw(1);
***/    
    evt.stopPropagation();
  });

  // listeners for sizing.
  box.addEventListener("mousedown", function(evt) {
    dump("mouse down at " + evt.clientX + "," + evt.clientY + " - " + (evt.target==box) + "\n", false)
/***
    dump("box is at " + box.boxObject.x + "," + box.boxObject.y + "\n");
    dump("rect width: " + box.getBoundingClientRect().left + "->" + box.getBoundingClientRect().right + "=" + (box.getBoundingClientRect().right - box.getBoundingClientRect().left)+ "\n");
    dump("rect height: " + box.getBoundingClientRect().top + "->" + box.getBoundingClientRect().bottom+ "=" + (box.getBoundingClientRect().bottom - box.getBoundingClientRect().top)+ "\n");
***/ 
    let [l, t, r, b] = getWhichBorders(evt.clientX, evt.clientY, box);
    resizeDirections = {};
    if (l) resizeDirections["left"] = true;
    if (t) resizeDirections["top"] = true;
    if (r) resizeDirections["right"] = true;
    if (b) resizeDirections["bottom"] = true;
    if (l || t || r || b) {
      box.setAttribute("resizing", "true");
      box.setCapture(true);
      dump("starting resize\n");
    }
  });
  box.addEventListener("mouseup", function(evt) {
    //dump("mouse up at " + evt.clientX + "," + evt.clientY + " - " + (evt.target==box) + "\n", false)
    if (box.hasAttribute("resizing")) {
      box.releaseCapture();
      box.removeAttribute("resizing");
      resizeDirections = {};
      dump("stopping resize\n");
    }
  });
  box.addEventListener("mousemove", function(evt) {
    if (evt.target != box) return;
    if (box.hasAttribute("resizing")) {
      dump("resizing: mouse at " + evt.clientX + "," + evt.clientY + "\n");
      if ("left" in resizeDirections) {
        // resizing the left border means we just increase the size of the box.
        let newWidth = box.getBoundingClientRect().right - evt.clientX;
        dump("should set new widgh " + newWidth + "\n");
        box.style.width = newWidth + "px";
      } else if ("right" in resizeDirections) {
        // resizing in the right dimension means we change the right-margin of the toolbar
        // and increate the width of the box accordingly.
        // a complication is that the box has a min-width, so we (a) calc the
        // width change, (b) set the width change, (c) check the actual width
        // change then adjust the margin based on that actual value.
        let bcr = box.getBoundingClientRect();
        let idealOffset = evt.clientX - bcr.right;
        let widthBefore = bcr.right - bcr.left;
        box.style.width = parsePx(box.style.width) + idealOffset + "px";
        bcr = box.getBoundingClientRect();
        let widthAfter = bcr.right - bcr.left;
        let actualOffset = widthAfter - widthBefore;
        let existingMargin = parsePx(document.getElementById("pinnedchat-toolbar").style.marginRight);
        let newMargin = existingMargin-actualOffset;
        document.getElementById("pinnedchat-toolbar").style.marginRight = newMargin + "px";
      }

      if ("top" in resizeDirections) {
        // resizing the top border means we increase margin-top of the box itself.
        // as above, we need to take min-height etc constraints into account.
        let bcr = box.getBoundingClientRect();
        dump("clientY: " + evt.clientY + " bounding top: " + bcr.top + "\n");
        let idealOffset = evt.clientY - bcr.top;
        let existingMargin = parsePx(box.style.marginTop);
        let newMargin = Math.min(-10, existingMargin + idealOffset); // arbitrary 10px min
        dump("new margin should be " + (existingMargin + idealOffset) + " and is actually " + newMargin + "\n");
        box.style.marginTop = newMargin + "px";
      }
      evt.stopPropagation();
      return;
    }
    let cursorMap = {}
    //         left, top,  right, bottom
    cursorMap[[true, false, false, false]] = "w-resize";
    cursorMap[[true, true,  false, false]] = "nw-resize";
    cursorMap[[true, false,  true, false]] = "sw-resize";
    cursorMap[[false, true,  false, false]] = "n-resize";
    cursorMap[[false, true,  true, false]] = "ne-resize";
    cursorMap[[false, false, true, true]] = "se-resize";
    cursorMap[[false, false, true, false]] = "e-resize";
    cursorMap[[false, false, false, true]] = "s-resize";
    box.style.cursor = cursorMap[getWhichBorders(evt.clientX, evt.clientY, box)] || "default";
  });
}
function removePinnedChat() {

}

pinnedChats_main();

dump("pinnedChats_main is loaded\n");
