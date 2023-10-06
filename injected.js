// console.log("############ injected.js");

// create the badge
document.body.insertAdjacentHTML('beforeend', `<div id="coupon_notifier_badge" title=""></div><div id="coupon_notifier_badge_details"><div></div></div>
  <style>
  #coupon_notifier_badge {
    width: 64px;
    height: 64px;
    display:none;
    background-color: white;
    align-items:center;
    justify-content:center;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    cursor: move;
    border-radius: 64px;
    border:1px solid black;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    animation: coupon_notifier_blink 3s infinite;
  }
  @keyframes coupon_notifier_blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }

  #coupon_notifier_badge_details {
    display: none;
    position: fixed;
    z-index: 9999;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }
  #coupon_notifier_badge_details > div {
    background-color: white;
    margin: auto;
    padding: 20px;
    border: 1px solid #888;
    width: 250px;
    text-align: left;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space:pre-line;
  }
  #coupon_notifier_badge_details a {
    color:blue !important;
    text-decoration:underline !important;
  }
  </style>`);


function sanitize(str) {
  const decoder = document.createElement('div')
  decoder.innerHTML = str;
  return decoder.textContent;
}

function linkify (str) {
  // eslint-disable-next-line
  let urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/\(\)%?=~_|!:,.;]*[-A-Z0-9+&@#\/\(\)%=~_|])/ig;
  return (str||"").replace(/</g, "&nbsp;").replace(urlRegex, function(url) {
    return '<a href="' + url + '" target="_blank">' + url + '</a>';
  })
}

let icon = document.getElementById("coupon_notifier_icon");
let badge = document.getElementById("coupon_notifier_badge");
let badgeDetails = document.getElementById("coupon_notifier_badge_details");
let isMoving = false; // when the badge is moving
badge.appendChild(icon);

badge.onmousedown = event => {
  // centers the badge at (pageX, pageY) coordinates
  function moveAt(pageX, pageY) {
    badge.style.left = pageX - badge.offsetWidth / 2 + 'px';
    badge.style.top = pageY - badge.offsetHeight / 2 + 'px';
  }

  // move our absolutely positioned badge under the pointer
  moveAt(event.pageX, event.pageY);

  function onMouseMove(event) {
    moveAt(event.pageX, event.pageY);
  }

  // move the badge on mousemove
  document.addEventListener('mousemove', onMouseMove);

  // drop the badge, remove unneeded handlers
  badge.onmouseup = function() {
    document.removeEventListener('mousemove', onMouseMove);
    badge.onmouseup = null;
  }
}
badge.ondragstart = function() {
  isMoving=true;
  return false;
}

badge.onclick = function() {
  // if we click on the button, and if it's not moving, then show the modal
  if (!isMoving) {
    badgeDetails.style.display = "block";
  }
  isMoving=false;
}

// when clicking outside the modal, hide it
window.addEventListener('click', function(event) {
  if (event.target === badgeDetails) {
    badgeDetails.style.display = 'none';
  } else if (isMoving) {
    document.removeEventListener('mousemove', onMouseMove);
    badge.onmouseup = null;
    isMoving = false;
  }
});

// listen to the messages sent from content.js
window.addEventListener("message", function(event) {
  if (event.data) {
    if (event.data.startsWith("coupon_notifier_badge_details:")) {
      let notes = event.data.slice("coupon_notifier_badge_details:".length).replaceAll("<br>", "\n").split("#@#");
      // show the badge
      badge.style.display = "flex";
      badgeDetails.querySelector('div').innerHTML = notes.map(note => linkify(sanitize(note))).join("<hr>");
    }
    else if (event.data.startsWith('coupon_notifier_badge_translation_title:')) {
      badge.setAttribute("title", event.data.slice("coupon_notifier_badge_translation_title:".length));
    }
  }
});
