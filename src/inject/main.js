player = document.getElementById('movie_player');
player.addEventListener("onStateChange", "onPlayerStateChanged");



var queue = [];
function onPlayerStateChanged(newState) {
// -1 (unstarted)
// 0 (ended)
// 1 (playing)
// 2 (paused)
// 3 (buffering)
// 5 (video cued).
	window.postMessage({ type: "FROM_PAGE", text: newState }, "*");
    console.log(link);
    console.log(link.substring(32))
    console.log(newState);
    if (newState == 0 && link != "nothing") {
        window.open(link,"_self");
    }
    // if (newState == 2) {
    // 	 window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
    // }
}