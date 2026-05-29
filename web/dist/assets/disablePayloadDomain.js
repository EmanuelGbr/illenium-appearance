(function () {
  "use strict";

  var SAFE_COMPONENT_FALLBACKS = {
    0: { component_id: 0, drawable: 15, texture: 0 },
    1: { component_id: 1, drawable: 0, texture: 0 },
    2: { component_id: 2, drawable: 0, texture: 0 },
    3: { component_id: 3, drawable: 15, texture: 0 },
    4: { component_id: 4, drawable: 15, texture: 0 },
    5: { component_id: 5, drawable: 0, texture: 0 },
    6: { component_id: 6, drawable: 34, texture: 0 },
    7: { component_id: 7, drawable: 0, texture: 0 },
    8: { component_id: 8, drawable: 15, texture: 0 },
    9: { component_id: 9, drawable: 0, texture: 0 },
    10: { component_id: 10, drawable: 0, texture: 0 },
    11: { component_id: 11, drawable: 15, texture: 0 }
  };

  var state = {
    initialAppearance: null,
    currentAppearance: null,
    settings: null
  };

  function clone(value) {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function findById(items, idKey, id) {
    return asArray(items).find(function (item) {
      return item && item[idKey] === id;
    });
  }

  function findSetting(settingsGroup, idKey, id) {
    return findById(settingsGroup, idKey, id) || {};
  }

  function safeNumber(value, fallback) {
    return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
  }

  function safeTextureFromSetting(setting, fallback) {
    var min = setting && setting.texture && setting.texture.min;
    var safeFallback = min === -1 ? -1 : 0;
    return safeNumber(fallback, safeFallback);
  }

  function safeOverlayStyle(setting) {
    var min = setting && setting.style && setting.style.min;
    return typeof min === "number" && min > 0 ? min : 0;
  }

  function safeHairStyle(settings) {
    var min = settings && settings.hair && settings.hair.style && settings.hair.style.min;
    return typeof min === "number" && min > 0 ? min : 0;
  }

  function resolveCategory(category) {
    if (typeof category === "string") return { type: category };
    return isObject(category) ? category : {};
  }

  function getComponentFallback(componentId, appearance) {
    var initialComponent = findById(appearance && appearance.components, "component_id", componentId);
    if (initialComponent && initialComponent.drawable !== -1) return clone(initialComponent);

    return clone(SAFE_COMPONENT_FALLBACKS[componentId] || {
      component_id: componentId,
      drawable: 0,
      texture: 0
    });
  }

  function getDisablePayloadForCategory(category, currentAppearance, settings) {
    var details = resolveCategory(category);
    var type = details.type || details.category;
    var item = clone(details.item || details.payload || {});
    var appearance = currentAppearance || state.initialAppearance || state.currentAppearance || {};
    var activeSettings = settings || state.settings || {};

    if (type === "prop" || type === "props") {
      var propId = safeNumber(details.id, safeNumber(item.prop_id, 0));
      var propSetting = findSetting(activeSettings.props, "prop_id", propId);
      return {
        endpoint: "appearance_change_prop",
        payload: {
          prop_id: propId,
          drawable: -1,
          texture: safeTextureFromSetting(propSetting)
        }
      };
    }

    if (type === "component" || type === "components") {
      var componentId = safeNumber(details.id, safeNumber(item.component_id, 0));
      var fallbackComponent = getComponentFallback(componentId, appearance);
      var componentSetting = findSetting(activeSettings.components, "component_id", componentId);
      return {
        endpoint: "appearance_change_component",
        payload: {
          component_id: componentId,
          drawable: safeNumber(fallbackComponent.drawable, 0),
          texture: safeTextureFromSetting(componentSetting, fallbackComponent.texture)
        }
      };
    }

    if (type === "hair") {
      var hair = clone((appearance && appearance.hair) || {});
      return {
        endpoint: "appearance_change_hair",
        payload: Object.assign({}, hair, item, {
          style: safeHairStyle(activeSettings)
        })
      };
    }

    if (type === "headOverlay" || type === "head_overlay" || type === "headOverlays" || type === "makeup" || type === "maquiagem") {
      var overlayName = details.name || details.id;
      var overlays = clone((appearance && appearance.headOverlays) || {});
      var overlaySettings = (activeSettings.headOverlays && activeSettings.headOverlays[overlayName]) || {};
      var currentOverlay = clone(overlays[overlayName] || {});

      overlays[overlayName] = Object.assign({}, currentOverlay, item, {
        style: safeOverlayStyle(overlaySettings),
        opacity: 0
      });

      return {
        endpoint: "appearance_change_head_overlay",
        payload: overlays
      };
    }

    if (type === "tattoo" || type === "tattoos") {
      var tattoos = clone((appearance && appearance.tattoos) || {});
      var zone = details.zone || item.zone;
      var name = details.name || item.name;

      if (zone && Array.isArray(tattoos[zone])) {
        tattoos[zone] = name ? tattoos[zone].filter(function (tattoo) {
          return tattoo && tattoo.name !== name;
        }) : [];
      }

      return {
        endpoint: "appearance_delete_tattoo",
        payload: tattoos
      };
    }

    if (type === "headBlend" || type === "head_blend" || type === "parents" || type === "pais") {
      return null;
    }

    return null;
  }

  function updateAppearanceFromPayload(endpoint, payload) {
    if (!state.currentAppearance || !payload) return;

    if (endpoint === "appearance_change_component") {
      var components = asArray(state.currentAppearance.components).filter(function (component) {
        return component.component_id !== payload.component_id;
      });
      components.push(clone(payload));
      state.currentAppearance.components = components;
    } else if (endpoint === "appearance_change_prop") {
      var props = asArray(state.currentAppearance.props).filter(function (prop) {
        return prop.prop_id !== payload.prop_id;
      });
      props.push(clone(payload));
      state.currentAppearance.props = props;
    } else if (endpoint === "appearance_change_hair") {
      state.currentAppearance.hair = clone(payload);
    } else if (endpoint === "appearance_change_head_overlay") {
      state.currentAppearance.headOverlays = clone(payload);
    } else if (endpoint === "appearance_delete_tattoo" || endpoint === "appearance_apply_tattoo") {
      state.currentAppearance.tattoos = clone(payload.updatedTattoos || payload);
    } else if (endpoint === "appearance_change_head_blend") {
      state.currentAppearance.headBlend = clone(payload);
    }
  }

  function containsMinusOne(value) {
    if (value === -1) return true;
    if (Array.isArray(value)) return value.some(containsMinusOne);
    if (!isObject(value)) return false;
    return Object.keys(value).some(function (key) {
      return containsMinusOne(value[key]);
    });
  }

  function sanitizeEndpointPayload(endpoint, payload) {
    if (!payload) return payload;

    if (endpoint === "appearance_change_prop" && payload.drawable === -1) {
      return getDisablePayloadForCategory({ type: "prop", id: payload.prop_id, item: payload }, state.currentAppearance, state.settings).payload;
    }

    if (endpoint === "appearance_change_component" && payload.drawable === -1) {
      return getDisablePayloadForCategory({ type: "component", id: payload.component_id, item: payload }, state.initialAppearance, state.settings).payload;
    }

    if (endpoint === "appearance_change_hair" && payload.style === -1) {
      return getDisablePayloadForCategory({ type: "hair", item: payload }, state.currentAppearance, state.settings).payload;
    }

    if (endpoint === "appearance_change_head_overlay") {
      var overlays = clone(payload);
      var changed = false;

      Object.keys(overlays).forEach(function (overlayName) {
        var overlay = overlays[overlayName];
        if (overlay && (overlay.style === -1 || overlay.opacity === -1)) {
          var safe = getDisablePayloadForCategory({
            type: "headOverlay",
            id: overlayName,
            item: overlay
          }, { headOverlays: overlays }, state.settings).payload;
          overlays[overlayName] = safe[overlayName];
          changed = true;
        }
      });

      return changed ? overlays : payload;
    }

    if (endpoint === "appearance_delete_tattoo" && (payload.zone || payload.name)) {
      return getDisablePayloadForCategory({ type: "tattoo", item: payload }, state.currentAppearance, state.settings).payload;
    }

    if (endpoint === "appearance_change_head_blend" && containsMinusOne(payload)) {
      return clone((state.currentAppearance && state.currentAppearance.headBlend) || (state.initialAppearance && state.initialAppearance.headBlend) || payload);
    }

    return payload;
  }

  function endpointFromUrl(input) {
    var url = typeof input === "string" ? input : input && input.url;
    if (!url) return null;
    return url.split("?")[0].split("/").pop();
  }

  function readJsonBody(init) {
    if (!init || typeof init.body !== "string") return null;
    try {
      return JSON.parse(init.body);
    } catch (_) {
      return null;
    }
  }

  function cacheResponse(endpoint, response) {
    if (!response || typeof response.clone !== "function") return;

    response.clone().json().then(function (data) {
      if (endpoint === "appearance_get_data" && data && data.appearanceData) {
        state.currentAppearance = clone(data.appearanceData);
        if (!state.initialAppearance) state.initialAppearance = clone(data.appearanceData);
      } else if (endpoint === "appearance_get_settings" && data && data.appearanceSettings) {
        state.settings = clone(data.appearanceSettings);
      } else if (endpoint === "appearance_change_model" && data) {
        if (data.appearanceData) {
          state.currentAppearance = clone(data.appearanceData);
          state.initialAppearance = clone(data.appearanceData);
        }
        if (data.appearanceSettings) state.settings = clone(data.appearanceSettings);
      }
    }).catch(function () {});
  }

  window.getDisablePayloadForCategory = getDisablePayloadForCategory;
  window.__illeniumDisablePayloadState = state;

  if (!window.__illeniumDisablePayloadFetchWrapped) {
    window.__illeniumDisablePayloadFetchWrapped = true;
    var nativeFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      var endpoint = endpointFromUrl(input);
      var nextInit = init;
      var payload = readJsonBody(init);

      if (endpoint && payload) {
        var sanitized = sanitizeEndpointPayload(endpoint, payload);
        if (sanitized !== payload) {
          nextInit = Object.assign({}, init, { body: JSON.stringify(sanitized) });
          payload = sanitized;
        }
        updateAppearanceFromPayload(endpoint, payload);
      }

      return nativeFetch(input, nextInit).then(function (response) {
        cacheResponse(endpoint, response);
        return response;
      });
    };
  }
})();
