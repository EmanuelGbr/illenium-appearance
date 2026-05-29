(() => {
  const MAX_LOG_LINES = 9;
  const ROTATION_SENSITIVITY = 0.28;
  const TEXTURE_MAX = 5;

  const categoryDefinitions = [
    { id: 'clothes', label: 'Roupas', kind: 'component', callback: 'appearance_change_component', icon: '👕', max: { male: 24, female: 26 }, component_id: 11 },
    { id: 'accessories', label: 'Acessórios', kind: 'prop', callback: 'appearance_change_prop', icon: '🕶️', max: { male: 18, female: 20 }, prop_id: 1 },
    { id: 'hair', label: 'Cabelos', kind: 'hair', callback: 'appearance_change_hair', icon: '💇', max: { male: 22, female: 24 } },
    { id: 'makeup', label: 'Maquiagem', kind: 'overlay', callback: 'appearance_change_head_overlay', icon: '💄', max: { male: 12, female: 18 } },
    { id: 'parents', label: 'Pai/Mãe', kind: 'parent', callback: 'appearance_change_head_blend', icon: '🧬', max: { male: 10, female: 10 } },
    { id: 'tattoos', label: 'Tatuagens', kind: 'tattoo', callback: 'appearance_preview_tattoo', icon: '🐉', max: { male: 16, female: 16 } },
    { id: 'overlays', label: 'Overlays', kind: 'overlay', callback: 'appearance_change_head_overlay', icon: '✨', max: { male: 14, female: 14 } },
  ];

  const state = {
    model: 'male',
    categoryIndex: 0,
    rotation: 0,
    categories: Object.fromEntries(categoryDefinitions.map((category) => [
      category.id,
      {
        drawable: category.kind === 'prop' ? -1 : 0,
        texture: 0,
        active: category.kind !== 'prop',
        opacity: category.kind === 'overlay' ? 1 : undefined,
      },
    ])),
    logs: [],
  };

  const elements = {
    tabs: document.getElementById('categoryTabs'),
    grid: document.getElementById('thumbnailGrid'),
    title: document.getElementById('categoryTitle'),
    gridTitle: document.getElementById('gridTitle'),
    modelPill: document.getElementById('modelPill'),
    callbackPill: document.getElementById('callbackPill'),
    drawableValue: document.getElementById('drawableValue'),
    textureValue: document.getElementById('textureValue'),
    activeValue: document.getElementById('activeValue'),
    rotationValue: document.getElementById('rotationValue'),
    log: document.getElementById('eventLog'),
    stage: document.getElementById('pedStage'),
    ped: document.getElementById('ped'),
    toggle: document.getElementById('toggleButton'),
    modelButtons: Array.from(document.querySelectorAll('.model-button')),
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const wrap = (value, length) => ((value % length) + length) % length;
  const currentCategory = () => categoryDefinitions[state.categoryIndex];
  const currentValue = () => state.categories[currentCategory().id];
  const modelName = () => state.model === 'male' ? 'mp_m_freemode_01' : 'mp_f_freemode_01';

  function postNuiMock(callback, payload) {
    const logLine = `${new Date().toLocaleTimeString()}  ${callback} ${JSON.stringify(payload)}`;
    state.logs.unshift(logLine);
    state.logs = state.logs.slice(0, MAX_LOG_LINES);
    elements.callbackPill.textContent = callback;
    elements.log.textContent = state.logs.join('\n');
  }

  function categoryMax(category = currentCategory()) {
    return category.max[state.model];
  }

  function getPayload(category, value) {
    if (category.kind === 'component') {
      return { component_id: category.component_id, drawable: value.drawable, texture: value.texture };
    }
    if (category.kind === 'prop') {
      return { prop_id: category.prop_id, drawable: value.drawable, texture: value.texture };
    }
    if (category.kind === 'hair') {
      return { style: value.drawable, texture: value.texture, color: 0, highlight: 0 };
    }
    if (category.kind === 'overlay') {
      return { [category.id]: { style: value.drawable, opacity: value.active ? value.opacity ?? 1 : 0, color: value.texture } };
    }
    if (category.kind === 'parent') {
      return { shapeFirst: value.drawable, shapeSecond: value.texture, skinFirst: value.drawable, skinSecond: value.texture, shapeMix: 0.5, skinMix: 0.5 };
    }
    return { tattoo: value.active ? { name: `${category.label} ${value.drawable}`, opacity: 1 } : null, zone: 'mock' };
  }

  function applyCategoryChange(callback = currentCategory().callback) {
    const category = currentCategory();
    const value = currentValue();
    postNuiMock(callback, getPayload(category, value));
    render();
  }

  function setCategory(index) {
    state.categoryIndex = wrap(index, categoryDefinitions.length);
    applyCategoryChange('appearance_set_camera');
  }

  function changeDrawable(direction) {
    const category = currentCategory();
    const value = currentValue();
    const min = category.kind === 'prop' ? -1 : 0;
    value.drawable = clamp(value.drawable + direction, min, categoryMax(category));
    value.texture = 0;
    value.active = category.kind === 'prop' ? value.drawable !== -1 : true;
    if (category.kind === 'overlay') value.opacity = 1;
    applyCategoryChange();
  }

  function changeTexture(direction) {
    const value = currentValue();
    value.texture = clamp(value.texture + direction, 0, TEXTURE_MAX);
    applyCategoryChange();
  }

  function selectDrawable(drawable) {
    const category = currentCategory();
    const value = currentValue();
    value.drawable = drawable;
    value.texture = 0;
    value.active = category.kind === 'prop' ? drawable !== -1 : true;
    if (category.kind === 'overlay') value.opacity = 1;
    applyCategoryChange();
  }

  function toggleCurrent() {
    const category = currentCategory();
    const value = currentValue();

    switch (category.kind) {
      case 'prop':
        value.drawable = value.drawable === -1 ? 0 : -1;
        value.texture = 0;
        value.active = value.drawable !== -1;
        break;
      case 'overlay':
        value.active = !value.active;
        value.opacity = value.active ? 1 : 0;
        break;
      case 'tattoo':
        value.active = !value.active;
        break;
      case 'parent':
        value.drawable = 0;
        value.texture = 0;
        value.active = true;
        break;
      default:
        value.active = !value.active;
        if (!value.active) {
          value.drawable = 0;
          value.texture = 0;
        }
        break;
    }

    const callback = category.kind === 'tattoo' && !value.active ? 'appearance_delete_tattoo' : category.callback;
    applyCategoryChange(callback);
  }

  function renderTabs() {
    elements.tabs.innerHTML = categoryDefinitions.map((category, index) => {
      const selected = index === state.categoryIndex ? ' is-active' : '';
      return `<button class="category-tab${selected}" type="button" data-category-index="${index}"><span>${category.icon} ${category.label}</span><span>${index + 1}/${categoryDefinitions.length}</span></button>`;
    }).join('');
  }

  function cardBackground(index) {
    const hue = (index * 31 + (state.model === 'female' ? 28 : 0)) % 360;
    return `linear-gradient(135deg, hsla(${hue}, 72%, 54%, 0.34), hsla(${(hue + 62) % 360}, 68%, 42%, 0.16))`;
  }

  function renderGrid() {
    const category = currentCategory();
    const value = currentValue();
    const min = category.kind === 'prop' ? -1 : 0;
    const items = [];

    for (let drawable = min; drawable <= categoryMax(category); drawable += 1) {
      const selected = drawable === value.drawable;
      const disabled = category.kind === 'prop' && drawable === -1;
      const label = disabled ? 'Removido' : `${category.label} ${drawable}`;
      items.push(`
        <button class="thumb-card${selected ? ' is-selected' : ''}${disabled ? ' is-disabled' : ''}" type="button" data-drawable="${drawable}" style="--thumb-bg:${cardBackground(drawable + 1)}" role="gridcell" aria-selected="${selected}">
          <span class="thumb-badge">${disabled ? 'off' : `#${drawable}`}</span>
          <span class="thumb-icon">${disabled ? '🚫' : category.icon}</span>
          <span class="thumb-meta"><strong>${label}</strong><span>tex ${selected ? value.texture : 0}</span></span>
        </button>
      `);
    }

    elements.grid.innerHTML = items.join('');
  }

  function renderPed() {
    const clothes = state.categories.clothes;
    const hair = state.categories.hair;
    const accessories = state.categories.accessories;
    const makeup = state.categories.makeup;
    const hue = (clothes.drawable * 24 + clothes.texture * 18 + (state.model === 'female' ? 315 : 215)) % 360;
    const hairHue = (hair.drawable * 18 + 25) % 360;
    const makeupOpacity = makeup.active ? 0.25 + makeup.texture * 0.08 : 0;

    elements.ped.style.transform = `rotateY(${state.rotation}deg)`;
    elements.ped.style.setProperty('--prop-opacity', accessories.active ? '1' : '0');
    elements.ped.querySelector('.ped-torso').style.background = `linear-gradient(145deg, hsl(${hue}, 54%, 38%), hsl(${hue}, 58%, 16%))`;
    elements.ped.querySelector('.ped-hair').style.background = `linear-gradient(135deg, hsl(${hairHue}, 42%, 18%), hsl(${hairHue}, 36%, 34%))`;
    elements.ped.querySelector('.ped-head').style.boxShadow = `inset 0 -1.1rem 2.5rem rgba(255, 80, 150, ${makeupOpacity})`;
  }

  function renderState() {
    const category = currentCategory();
    const value = currentValue();
    elements.title.textContent = category.label;
    elements.gridTitle.textContent = `${category.icon} ${category.label} (${state.model === 'male' ? 'masculino' : 'feminino'})`;
    elements.modelPill.textContent = modelName();
    elements.drawableValue.textContent = value.drawable;
    elements.textureValue.textContent = value.texture;
    elements.activeValue.textContent = value.active ? 'Ativo' : 'Inativo';
    elements.rotationValue.textContent = `${Math.round(state.rotation)}°`;
  }

  function render() {
    renderTabs();
    renderGrid();
    renderPed();
    renderState();
    elements.modelButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.model === state.model));
  }

  function handleKeydown(event) {
    if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;

    const handlers = {
      ArrowLeft: () => changeDrawable(-1),
      ArrowRight: () => changeDrawable(1),
      ArrowUp: () => changeTexture(1),
      ArrowDown: () => changeTexture(-1),
      KeyQ: () => setCategory(state.categoryIndex - 1),
      KeyE: () => setCategory(state.categoryIndex + 1),
      Space: () => toggleCurrent(),
    };

    const handler = handlers[event.code];
    if (!handler) return;
    event.preventDefault();
    handler();
  }

  function setupDragRotation() {
    let dragging = false;
    let lastX = 0;
    let pendingDelta = 0;
    let frame = 0;

    const flush = () => {
      if (pendingDelta !== 0) {
        state.rotation = (state.rotation + pendingDelta * ROTATION_SENSITIVITY) % 360;
        pendingDelta = 0;
        renderPed();
        elements.rotationValue.textContent = `${Math.round(state.rotation)}°`;
      }
      frame = 0;
    };

    const endDrag = () => {
      dragging = false;
      pendingDelta = 0;
      elements.stage.classList.remove('is-dragging');
    };

    elements.stage.addEventListener('pointerdown', (event) => {
      dragging = true;
      lastX = event.clientX;
      elements.stage.setPointerCapture?.(event.pointerId);
      elements.stage.classList.add('is-dragging');
    });

    elements.stage.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      pendingDelta += event.clientX - lastX;
      lastX = event.clientX;
      if (!frame) frame = requestAnimationFrame(flush);
    });

    elements.stage.addEventListener('pointerup', endDrag);
    elements.stage.addEventListener('pointercancel', endDrag);
    elements.stage.addEventListener('lostpointercapture', endDrag);
    window.addEventListener('blur', endDrag);
  }

  elements.tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category-index]');
    if (!button) return;
    setCategory(Number(button.dataset.categoryIndex));
  });

  elements.grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-drawable]');
    if (!button) return;
    selectDrawable(Number(button.dataset.drawable));
  });

  elements.toggle.addEventListener('click', toggleCurrent);
  elements.modelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.model = button.dataset.model;
      postNuiMock('appearance_change_model', modelName());
      render();
    });
  });

  window.addEventListener('keydown', handleKeydown);
  setupDragRotation();
  postNuiMock('appearance_display', { asynchronous: false, browserPreview: true });
  render();
})();
