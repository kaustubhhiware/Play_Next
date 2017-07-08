function insert_main() {
    (function(document) {
        "use strict";
        var s = document.createElement("script");
        s.src = chrome.extension.getURL("src/inject/main.js");
        s.onload = function() {
            this.parentNode.removeChild(this);
            s = undefined
        };
        document.documentElement.appendChild(s)
    })(window.document);
}

var queue = [];
var save_address = 'songs_queue';
if (localStorage.getItem(save_address) != null) {
    queue = JSON.parse(localStorage[save_address]);
}

insert_main();
// At the very start add the buttons
insertButton();
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';
var prevDOM = null;

// Add bubble to the top of the page.
var bubbleDOM = document.createElement('div');
bubbleDOM.setAttribute('class', 'selection_bubble');
document.body.appendChild(bubbleDOM);

function insertButton() {
    var to_match = 'a[class="';
    var LOC_HREF = 0;
    if (document.location.href == "https://www.youtube.com/") {
        to_match = to_match.concat(" yt-ui-ellipsis yt-ui-ellipsis-2 yt-uix-sessionlink      spf-link ", '"]');
        LOC_HREF = 1;
    }
    else if (document.location.href.substring(0, 29) == "https://www.youtube.com/watch") {
        to_match = to_match.concat(" content-link spf-link  yt-uix-sessionlink      spf-link ", '"]');
        LOC_HREF = 2;
    }
    else if (document.location.href.substring(0, 31) == "https://www.youtube.com/results") {
        to_match = to_match.concat("yt-uix-tile-link yt-ui-ellipsis yt-ui-ellipsis-2 yt-uix-sessionlink      spf-link ", '"]');
        LOC_HREF = 3;
    }
    else if (document.location.href == "https://www.youtube.com/feed/trending") {
        to_match = to_match.concat("yt-uix-tile-link yt-ui-ellipsis yt-ui-ellipsis-2 yt-uix-sessionlink      spf-link ", '"]');
        LOC_HREF = 4;
    }
    var buttons = document.querySelectorAll('p[class="button play-next"]');
    var download_links = document.querySelectorAll(to_match);
    if(download_links.length != buttons.length){
        for (var i = download_links.length-1; i >=buttons.length ; --i) {
            var link = download_links[i];
            var p = document.createElement('p');
            p.innerHTML = '<a><i>Play Next</i></a>';
            p.className = "button play-next";
            p.querySelector('a').addEventListener('click',clickHandler,true);
            link.parentElement.insertAdjacentElement('afterbegin',p);
            p.dataset.inQueue = "0";
            p.dataset.name = link.href;
            if (LOC_HREF == 2)
                p.dataset.song_name = link.querySelectorAll('span[class="title"]')[0].innerText;
            if (LOC_HREF == 1 || LOC_HREF == 3 || LOC_HREF == 4)
                p.dataset.song_name = link.innerText;
        }
    }
    insertPlayInfo();
}

function insertPlayInfo() {
    if (window.queue.length > 0) {
        tmp = 'p[data-name="';
        tmp = tmp.concat(window.queue[0][0]);
        tmp = tmp.concat('"');
        var next_song = document.querySelectorAll(tmp);
        if (next_song.length > 0) {
            next_song[0].innerHTML = '<a style="color: blue"><i>Playing Next</i></a>';
            next_song[0].dataset.inQueue = "1";
            next_song[0].querySelector('a').addEventListener('click',clickHandler,true);
        }
        for (var i = 1; i < window.queue.length; ++i) {
            tmp = 'p[data-name="';
            tmp = tmp.concat(window.queue[i][0]);
            tmp = tmp.concat('"');
            var que_song = document.querySelectorAll(tmp);
            if (que_song.length > 0) {
                var tmp = '<a style="color: blue"><i>In Queue at #';
                tmp = tmp.concat((i+1).toString(), '</i></a>');
                que_song[0].innerHTML = tmp;
                que_song[0].dataset.inQueue = "1";
                que_song[0].querySelector('a').addEventListener('click',clickHandler,true);
            }
        }
        // TODO: change the next button icon
        // var next_button = document.querySelectorAll('a[class="ytp-next-button ytp-button"]');
        // if (next_button.length > 0) {
        //     console.log(next_button);
        //         console.log("hello")
        //         next_button[0].dataset.preview = "https://i.ytimg.com/vi/" + window.queue[0][0].substring(30) + "/hqdefault.jpg?custom=true&w=320&h=180&stc=true&jpg444=true&jpgq=90&sp=68&sigh=NZZP4Vcuwk4EsQsZgP-YAPOp0nM";
        //         next_button[0].href = window.queue[0][0];
        // }
    }
}


function clickHandler(e){
    // update queue
    if (localStorage.getItem(save_address) != null) {
        window.queue = JSON.parse(localStorage[save_address]);
    }
    if (window.queue.length == 0) {
        console.log("case 0");
        window.queue.push([this.parentNode.dataset.name, this.parentNode.dataset.song_name]);
    }
    else if (this.parentNode.dataset.inQueue == "0") {
        console.log("case 1");
        window.queue.push([this.parentNode.dataset.name, this.parentNode.dataset.song_name]);
    }
    else {
        console.log("case 2");
        var i = 0;
        for (i = 0; i < window.queue.length; ++i) {
            if (window.queue[i][0] == this.parentNode.dataset.name)
                break;
        }
        console.log(window.queue, i);
        window.queue.splice(i, 1);
        console.log(window.queue);
        this.parentNode.dataset.inQueue = "0";
        // small hack. TODO: fix this
        this.parentNode.innerHTML = '<a class="add_event_hack"><i>Play Next</i></a>';
        var tmp = document.getElementsByClassName("add_event_hack");
        for (var i = 0; i < tmp.length; ++i) {
            tmp[i].addEventListener('click', clickHandler, false);
        }
    }
    localStorage[save_address] = JSON.stringify(window.queue);
    insertPlayInfo();
}

chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {
    if (localStorage.getItem(save_address) != null) {
        window.queue = JSON.parse(localStorage[save_address]);
    }
    insert_main();
    insertButton();

    var domInfo = " ";
    for (var i = 0; i < window.queue.length; ++i) {
        domInfo = domInfo.concat("<a href = '", window.queue[i][0], "'>", window.queue[i][1], "</a><br/><br/>");
    }
    // Directly respond to the sender (popup), 
    // through the specified callback */
    response(domInfo);
  }
});

// YouTube specific transition
document.addEventListener("spfdone", process);
function process() {
    insert_main();
    insertButton();
}

// https://stackoverflow.com/questions/4409378/text-selection-and-bubble-overlay-as-chrome-extension
// Move that bubble to the appropriate location.
function renderBubble(mouseX, mouseY, selection) {
  bubbleDOM.innerHTML = selection;
  bubbleDOM.style.top = mouseY + 'px';
  bubbleDOM.style.left = mouseX + 'px';
  bubbleDOM.style.visibility = 'visible';
}

// https://stackoverflow.com/questions/4445102/google-chrome-extension-highlight-the-div-that-the-mouse-is-hovering-over
document.addEventListener('mousemove', function (e) {
  var srcElement = e.srcElement;
  // Lets check if our underlying element is a DIV.
  var cls = srcElement.className;
  if (cls.indexOf('related-item-dismissable') !== -1 ||
        cls.indexOf('related-list-item') !== -1) {

    // For NPE checking, we check safely. We need to remove the class name
    // Since we will be styling the new one after.
    if (prevDOM != null) {
      prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
      bubbleDOM.style.visibility = 'hidden';
    }

    // Add a visited class name to the element. So we can style it.
    srcElement.classList.add(MOUSE_VISITED_CLASSNAME);
    var selection = '<a href="http://github.com">Link 1</a>\
    <br /><br />\
    <a href="http://youtube.com">Link 2</a>';
    // var selection = window.getSelection().toString();
    if (selection.length > 0) {
        renderBubble(e.clientX - e.offsetX, e.clientY - e.offsetY, selection);
    }

    // The current element is now the previous. So we can remove the class
    // during the next iteration.
    prevDOM = srcElement;
    // window.open("hover_popup.html", "extension_popup", "width=300,height=400,status=no,scrollbars=yes,resizable=no");
  }
}, false);