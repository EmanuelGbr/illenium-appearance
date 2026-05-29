(() => {
  const RESOURCE_NAME = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'illenium-appearance';
  const CALLBACK_NAME = 'appearance_rotate_ped_delta';
  const SENSITIVITY = 0.25;
  const DRAG_AREA_ID = 'appearance-preview-drag-area';

  const dragState = {
    active: false,
    lastX: 0,
    delta: 0,
    frame: 0,
  };

  const postNui = (callbackName, data = {}) => {
    fetch(`https://${RESOURCE_NAME}/${callbackName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  const flushDragDelta = () => {
    const delta = dragState.delta;

    dragState.delta = 0;
    dragState.frame = 0;

    if (delta !== 0) {
      postNui(CALLBACK_NAME, { delta: delta * SENSITIVITY });
    }
  };

  const queueDragDelta = () => {
    if (dragState.frame === 0) {
      dragState.frame = requestAnimationFrame(flushDragDelta);
    }
  };

  const clearDragState = () => {
    dragState.active = false;
    dragState.delta = 0;

    if (dragState.frame !== 0) {
      cancelAnimationFrame(dragState.frame);
      dragState.frame = 0;
    }
  };

  const handlePointerDown = (event) => {
    event.preventDefault();

    dragState.active = true;
    dragState.lastX = event.clientX;
    dragState.delta = 0;

    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    if (!dragState.active) {
      return;
    }

    event.preventDefault();

    dragState.delta += event.clientX - dragState.lastX;
    dragState.lastX = event.clientX;

    queueDragDelta();
  };

  const createDragArea = () => {
    if (document.getElementById(DRAG_AREA_ID)) {
      return;
    }

    const dragArea = document.createElement('div');

    dragArea.id = DRAG_AREA_ID;
    dragArea.setAttribute('aria-label', 'Rotate character preview');
    dragArea.style.position = 'absolute';
    dragArea.style.left = '25vw';
    dragArea.style.top = '8vh';
    dragArea.style.width = '50vw';
    dragArea.style.height = '84vh';
    dragArea.style.zIndex = '1';
    dragArea.style.cursor = 'grab';
    dragArea.style.touchAction = 'none';
    dragArea.style.userSelect = 'none';

    dragArea.addEventListener('pointerdown', handlePointerDown);
    dragArea.addEventListener('pointermove', handlePointerMove);
    dragArea.addEventListener('pointerup', clearDragState);
    dragArea.addEventListener('pointercancel', clearDragState);
    dragArea.addEventListener('mouseleave', clearDragState);

    document.body.appendChild(dragArea);
  };

  const removeDragArea = () => {
    clearDragState();
    document.getElementById(DRAG_AREA_ID)?.remove();
  };

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'appearance_display') {
      createDragArea();
    } else if (event.data?.type === 'appearance_hide') {
      removeDragArea();
    }
  });

  window.addEventListener('pointerup', clearDragState);
  window.addEventListener('pointercancel', clearDragState);
  window.addEventListener('blur', clearDragState);
})();
