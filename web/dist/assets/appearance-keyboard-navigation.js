(() => {
  const SHORTCUT_KEYS = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyQ",
    "KeyE",
    "Space",
  ]);

  const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
  const CONTROL_SELECTOR = "input, button, [role='button'], [role='option']";

  let currentCategoryIndex = 0;
  let currentControlPairIndex = 0;

  const isEditableTarget = (target) => {
    if (!target) return false;
    return target.isContentEditable || EDITABLE_TAGS.has(target.tagName);
  };

  const isVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };

  const getPanelRoot = () => document.querySelector("#root") || document.body;

  const getCategories = () => {
    const root = getPanelRoot();
    return Array.from(root.querySelectorAll("div"))
      .filter((element) => isVisible(element))
      .filter((element) => {
        const buttons = element.querySelectorAll("button");
        const inputs = element.querySelectorAll("input");
        return buttons.length >= 2 && inputs.length > 0;
      });
  };

  const clampIndex = (index, length) => {
    if (length <= 0) return 0;
    return ((index % length) + length) % length;
  };

  const getCurrentCategory = () => {
    const categories = getCategories();
    currentCategoryIndex = clampIndex(currentCategoryIndex, categories.length);
    return categories[currentCategoryIndex] || null;
  };

  const getNumericInputs = () => {
    const category = getCurrentCategory();
    if (!category) return [];
    return Array.from(category.querySelectorAll("input[type='number'], input[type='range']")).filter(isVisible);
  };

  const getControlPairs = () => {
    const inputs = getNumericInputs();
    const pairs = [];

    for (const input of inputs) {
      const wrapper = input.closest("div");
      if (!wrapper) continue;
      const buttons = Array.from(wrapper.querySelectorAll("button")).filter(isVisible);
      const decrement = buttons[0];
      const increment = buttons[buttons.length - 1];
      pairs.push({ decrement, increment, input });
    }

    currentControlPairIndex = clampIndex(currentControlPairIndex, pairs.length);
    return pairs;
  };

  const clickControl = (pairIndex, direction) => {
    const pairs = getControlPairs();
    const pair = pairs[pairIndex];
    if (!pair) return false;

    const button = direction < 0 ? pair.decrement : pair.increment;
    if (button) {
      button.click();
      return true;
    }

    if (pair.input) {
      const step = Number(pair.input.step || 1) || 1;
      const currentValue = Number(pair.input.value || 0);
      pair.input.value = String(currentValue + step * direction);
      pair.input.dispatchEvent(new Event("input", { bubbles: true }));
      pair.input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    return false;
  };

  const cycleCategory = (direction) => {
    const categories = getCategories();
    if (!categories.length) return false;

    currentCategoryIndex = clampIndex(currentCategoryIndex + direction, categories.length);
    currentControlPairIndex = 0;
    categories[currentCategoryIndex].scrollIntoView({ block: "nearest", inline: "nearest" });
    return true;
  };

  const toggleCurrentCategory = () => {
    const category = getCurrentCategory();
    if (!category) return false;

    const tattooAction = Array.from(category.querySelectorAll("span, button"))
      .filter(isVisible)
      .find((element) => /apply|delete|aplicar|remover|deletar|excluir/i.test(element.textContent || ""));

    if (tattooAction) {
      tattooAction.click();
      return true;
    }

    const pairs = getControlPairs();
    if (!pairs.length) return false;

    const firstPair = pairs[0];
    const value = Number(firstPair.input.value || 0);
    const min = Number(firstPair.input.min || 0);

    if (value === min) {
      return clickControl(0, 1);
    }

    if (firstPair.input) {
      firstPair.input.value = String(min);
      firstPair.input.dispatchEvent(new Event("input", { bubbles: true }));
      firstPair.input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    return clickControl(0, -1);
  };

  const handleKeyDown = (event) => {
    if (!SHORTCUT_KEYS.has(event.code) || isEditableTarget(event.target)) return;

    let handled = false;
    switch (event.code) {
      case "ArrowLeft":
        handled = clickControl(0, -1);
        break;
      case "ArrowRight":
        handled = clickControl(0, 1);
        break;
      case "ArrowUp":
        handled = clickControl(1, 1);
        break;
      case "ArrowDown":
        handled = clickControl(1, -1);
        break;
      case "KeyQ":
        handled = cycleCategory(-1);
        break;
      case "KeyE":
        handled = cycleCategory(1);
        break;
      case "Space":
        handled = toggleCurrentCategory();
        break;
      default:
        break;
    }

    if (handled) event.preventDefault();
  };

  window.useAppearanceKeyboardNavigation = () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  };

  window.useAppearanceKeyboardNavigation();
})();
