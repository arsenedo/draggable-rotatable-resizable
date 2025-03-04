const interactElement = interact('.draggable');

const element = document.querySelector('.draggable');

interactElement.draggable({
  listeners: {
    move (event) {
        const {target} = event

        const posX = parseInt(css(target, 'left'), 10);
        const posY = parseInt(css(target, 'top'), 10);
        event.target.style.left = posX + event.delta.x + "px";
        event.target.style.top = posY + event.delta.y + "px";
    },
  }
})

interact(".rotate-handle").draggable({
    onstart: function(event) {
        let box = event.target.parentElement;
        let rect = box.getBoundingClientRect();

        // store the center as the element has css `transform-origin: center center`
        box.setAttribute('data-center-x', rect.left + rect.width / 2);
        box.setAttribute('data-center-y', rect.top + rect.height / 2);
        // get the angle of the element when the drag starts
        box.setAttribute('data-angle', getDragAngle(event));
    },
    onmove: function(event) {
        let box = event.target.parentElement;

        let angle = getDragAngle(event);
        box.style.transform = `rotate(${angle}rad)`;

        updateLblAlign(box, angle);
    },
    onend: function(event) {
        const {target} = event;
        let box = target.parentElement;

        const dragAngle = getDragAngle(event);

        // save the angle on dragend
        box.setAttribute('data-angle', dragAngle);

        const startWidth = parseFloat(css(box, "width"), 10);
        const startHeight = parseFloat(css(box, "height"), 10);
        const posX = parseFloat(css(box, "left"), 10);
        const posY = parseFloat(css(box, "top"), 10);

        const center = {
          x : posX + startWidth / 2,
          y : posY + startHeight / 2,
      }

        const resizeHandles = document.querySelectorAll(".resize-handle");
        
        resizeHandles.forEach(handle => {
          const handleRect = handle.getBoundingClientRect();

          const handleAngle = angle(center, {x : handleRect.x, y: handleRect.y});
          handle.style.cursor = rotateCursor(handle, handleAngle);
        });
    },
})

interactElement
  .resizable({
    edges: {
        top: '.resize-handle-top',
        bottom: '.resize-handle-bottom',
        left: '.resize-handle-left',
        right: '.resize-handle-right',
    },
    listeners: {
      move: function (event) {
        const { target } = event;
        const { edges } = event;

        const startWidth = parseFloat(css(target, "width"), 10);
        const startHeight = parseFloat(css(target, "height"), 10);
        const posX = parseFloat(css(target, "left"), 10);
        const posY = parseFloat(css(target, "top"), 10);

        const minWidth = 20;
        const minHeight = 20;

        // point that should NOT move. Usually it's the opposite point to the dragged one
        const pointA = {
          x : 0,
          y : 0
        };

        if (edges.top && edges.left) {
          pointA.x = posX + startWidth;
          pointA.y = posY + startHeight;
        } else if (edges.top && edges.right) {
          pointA.x = posX;
          pointA.y = posY + startHeight;
        } else if (edges.bottom && edges.left) {
          pointA.x = posX + startWidth;
          pointA.y = posY;
        } else if (edges.bottom && edges.right) {
          pointA.x = posX;
          pointA.y = posY
        }

        const center = {
            x : posX + startWidth / 2,
            y : posY + startHeight / 2,
        }

        const angle = target.getAttribute("data-angle") ? parseFloat(target.getAttribute("data-angle")) : 0;

        const rotatedA = rotate(pointA, center, angle);

        const dragPoint = {
            x : event.client.x,
            y : event.client.y,
        };

        const newCenter = {
            x : (rotatedA.x + dragPoint.x) / 2,
            y : (rotatedA.y + dragPoint.y) / 2,
        }

        const newA = rotate(rotatedA, newCenter, -angle);
        const newC = rotate(dragPoint, newCenter, -angle);

        /*const div = document.createElement("div");
        div.style.width = 5 + "px";
        div.style.height = 5 + "px";
        div.style.background = "orange";
        div.style.top = newCenter.y + "px";
        div.style.left = newCenter.x + "px";
        div.style.position = "absolute";
        document.body.appendChild(div);

        setTimeout(() => {
          div.remove();
        }, 5000)*/

        const positions = {
          "top-left": { x: newC.x, y: newC.y, width: newA.x - newC.x, height: newA.y - newC.y },
          "top-right": { x: newA.x, y: newC.y, width: newC.x - newA.x, height: newA.y - newC.y },
          "bottom-right": { x: newA.x, y: newA.y, width: newC.x - newA.x, height: newC.y - newA.y },
          "bottom-left": { x: newC.x, y: newA.y, width: newA.x - newC.x, height: newC.y - newA.y }
        };
        
        const key = `${edges.top ? "top" : "bottom"}-${edges.left ? "left" : "right"}`;
        
        const position = positions[key];

        if(position.width < 20 || position.height < 20) {
          const positionCenter = {
            x: position.x + position.width / 2,
            y: position.y + position.height / 2,
          };
        
          // Enforce minimum width and height
          const correctedWidth = Math.max(position.width, minWidth);
          const correctedHeight = Math.max(position.height, minHeight);
        
          // Adjust based on the dragged corner
          let adjustedX = position.x;
          let adjustedY = position.y;
        
          if (edges.top) {
            adjustedY = position.y + (position.height - correctedHeight);
          }
          if (edges.left) {
            adjustedX = position.x + (position.width - correctedWidth);
          }
        
          const rotatedPosition = rotate(
            { x: adjustedX, y: adjustedY },
            positionCenter,
            angle
          );
        
          const rotatedBottomRight = rotate(
            {
              x: adjustedX + correctedWidth,
              y: adjustedY + correctedHeight,
            },
            positionCenter,
            angle
          );
        
          const correctedCenter = {
            x: (rotatedPosition.x + rotatedBottomRight.x) / 2,
            y: (rotatedPosition.y + rotatedBottomRight.y) / 2,
          };
        
          const correctedA = rotate(rotatedPosition, correctedCenter, -angle);
          const correctedC = rotate(rotatedBottomRight, correctedCenter, -angle);
        
          position.x = correctedA.x;
          position.y = correctedA.y;
          position.width = correctedC.x - correctedA.x;
          position.height = correctedC.y - correctedA.y;
        }

        const {x, y, width, height} = position;

        Object.assign(target.style, {
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`
        });
      }
    }
  })

const getDragAngle = (event) => {
	let box = event.target.parentElement;
	let startAngle = parseFloat(box.getAttribute('data-angle')) || 0;
	let center = {
	  x: parseFloat(box.getAttribute('data-center-x')) || 0,
	  y: parseFloat(box.getAttribute('data-center-y')) || 0
	};
	let angle = Math.atan2(center.y - event.clientY,
	  center.x - event.clientX);
  
	return angle - startAngle;
  }


const css = ( element, property ) => {
	return window.getComputedStyle( element, null ).getPropertyValue( property );
}

const rotate = (coords, center, angle) => {
    return {
      x : (coords.x - center.x) * Math.cos(angle) - (coords.y - center.y) * Math.sin(angle) + center.x,
      y : (coords.x - center.x) * Math.sin(angle) + (coords.y - center.y) * Math.cos(angle) + center.y
    }
  }

const rotateCursor = (cursorHTML, angle) => {
  const normalizedAngle = angle % 360; // Keep within 0-359 range
  const quadrant = Math.floor(normalizedAngle / 90); // Determine which 90° quadrant we're in
  const withinQuadrant = normalizedAngle % 90; // Get angle within the current quadrant

  // Define cursor transitions within a quadrant
  const cursorTypes = [
    ["ew-resize", "nwse-resize", "ns-resize"], // 0° - 90°
    ["ns-resize", "nesw-resize", "ew-resize"], // 90° - 180°
    ["ew-resize", "nwse-resize", "ns-resize"], // 180° - 270°
    ["ns-resize", "nesw-resize", "ew-resize"], // 270° - 360°
  ];

  // Select cursor based on where we are within the quadrant
  const index = withinQuadrant <= 20 ? 0 : withinQuadrant <= 75 ? 1 : 2;
  cursorHTML.style.cursor = cursorTypes[quadrant][index];
};

const angle = (anchor, point) => Math.atan2(anchor.y - point.y, anchor.x - point.x) * 180 / Math.PI + 180;

const updateLblAlign = (widget, angle = null) => {
  const label = widget.querySelector(".label");
  const labelWrapper = label.parentElement;
  labelWrapper.className = "label-wrapper";

  if (!window.isLblAnchored) {
    label.style.transform = `rotate(${angle ? -angle : 0}rad)`;
    labelWrapper.classList.add("free-spin");
    return;
  } 

  label.style.transform = "";

  labelWrapper.classList.add("anchor");

  const normalizedAngle = Math.abs((angle * (180/Math.PI)) % 360); // Keep within 0-359 range
  const quadrant = Math.floor(normalizedAngle / 90); // Determine which 90° quadrant we're in
  const withinQuadrant = normalizedAngle % 90; // Get angle within the current quadrant

  console.log(normalizedAngle);
  let anchor = "bottom-right";

  if(0 <= normalizedAngle && normalizedAngle <= 60) {
    anchor = "bottom-right";
  } else if (60 < normalizedAngle && normalizedAngle <= 150) {
    anchor = "top-right";
  } else if (150 < normalizedAngle && normalizedAngle <= 240) {
    anchor = "top-left";
  } else if (240 < normalizedAngle && normalizedAngle <= 360) {
    anchor = "bottom-left";
  }

  labelWrapper.classList.add(anchor)

  
}

window.addEventListener("load", () => {
  const lblAlignBtn = document.querySelector(".btn.lbl-align");
  lblAlignBtn.addEventListener("click", (e) => {
    window.isLblAnchored = !window.isLblAnchored;

     e.target.textContent = window.isLblAnchored ? "Anchor" : "Free Spin";

     updateLblAlign(element, element.getAttribute("data-angle"));
  });
});