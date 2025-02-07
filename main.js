const interactElement = interact('.draggable');

const element = document.querySelector('.draggable');

interactElement.draggable({
  listeners: {
    start (event) {
      console.log(event.type, event.target)
    },
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

        const posX = parseInt(css(event.target, "left"), 10);
        const posY = parseInt(css(event.target, "top"), 10);

        let angle = getDragAngle(event);
        box.style.transform = `rotate(${angle}rad)`
    },
    onend: function(event) {
        let box = event.target.parentElement;

        // save the angle on dragend
        box.setAttribute('data-angle', getDragAngle(event));
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
      
        const width = parseFloat(css(target, "width"), 10);
        const height = parseFloat(css(target, "height"), 10);
        const posX = parseFloat(css(target, "left"), 10);
        const posY = parseFloat(css(target, "top"), 10);

        // point that should NOT move. Usually it's the opposite point to the dragged one
        const pointA = {
          x : 0,
          y : 0
        };

        if (edges.top && edges.left) {
          pointA.x = posX + width;
          pointA.y = posY + height;
        } else if (edges.top && edges.right) {
          pointA.x = posX;
          pointA.y = posY + height;
        } else if (edges.bottom && edges.left) {
          pointA.x = posX + width;
          pointA.y = posY;
        } else if (edges.bottom && edges.right) {
          pointA.x = posX;
          pointA.y = posY
        }

        const center = {
            x : posX + width / 2,
            y : posY + height / 2,
        }

        const angle = target.getAttribute("data-angle") ? parseFloat(target.getAttribute("data-angle")) : 0;

        // POINT THAT DOESN'T MOVE
        const rotatedA = rotate(pointA, center, angle);


        var cosFraction = Math.cos(angle);
        var sinFraction = Math.sin(angle);
        var rotatedWDiff = cosFraction * event.delta.x + sinFraction * event.delta.y;
        var rotatedHDiff = cosFraction * event.delta.y - sinFraction * event.delta.x;

        const dragPoint = {
            x : event.client.x + rotatedWDiff,
            y : event.client.y + rotatedHDiff,
        };

        const newCenter = {
            x : (rotatedA.x + dragPoint.x) / 2,
            y : (rotatedA.y + dragPoint.y) / 2,
        }

        const newA = rotate(rotatedA, newCenter, -angle);
        const newC = rotate(dragPoint, newCenter, -angle);

        const div = document.createElement("div");
        div.style.width = 5 + "px";
        div.style.height = 5 + "px";
        div.style.background = "orange";
        div.style.top = newCenter.y + "px";
        div.style.left = newCenter.x + "px";
        div.style.position = "absolute";
        document.body.appendChild(div);

        const positions = {
          "top-left": { x: newC.x, y: newC.y, width: newA.x - newC.x, height: newA.y - newC.y },
          "top-right": { x: newA.x, y: newC.y, width: newC.x - newA.x, height: newA.y - newC.y },
          "bottom-right": { x: newA.x, y: newA.y, width: newC.x - newA.x, height: newC.y - newA.y },
          "bottom-left": { x: newC.x, y: newA.y, width: newA.x - newC.x, height: newC.y - newA.y }
        };
        
        const key = `${edges.top ? "top" : "bottom"}-${edges.left ? "left" : "right"}`;
        
        if (positions[key]) {
          const { x, y, width, height } = positions[key];
        
          Object.assign(target.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`
          });
        }
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