let playerLoaderSprite = gameDefaultSprite.sprite || gameDefaultSprite;
let playerLoaderSpriteIdx = gameDefaultSprite.idx || 0;
let loaderSpriteCache = {};
let activeLoaders = new WeakMap;
let loadingCounter = 0;

function addLoader(target, instant) {
  if (activeLoaders.has(target))
    return;
  activeLoaders.set(target, true);
  // TODO: optimize
  const targetPosition = getComputedStyle(target).position;

  const getLoaderSprites = [
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 0),
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 1),
    getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, 2)
  ];
  const frameIndexes = [ 1, 0, 1, 2 ];
  Promise.allSettled(getLoaderSprites)
    .then(() => {
      if (!activeLoaders.has(target) || activeLoaders.get(target) !== true)
        return;
        
      const el = document.createElement('div');
      el.classList.add('loader');

      switch (targetPosition) {
        case 'fixed':
        case 'relative':
          el.style.position = 'fixed';
          break;
      }

      const updateLoaderFrame = () => {
        getLoaderSpriteImg(playerLoaderSprite, playerLoaderSpriteIdx, frameIndexes[loader.frame])
          .then(url => loader.element.children[0].src = url);
        if (loader.frame < 3)
          loader.frame++;
        else
          loader.frame = 0;
      };
      const loader = {
        element: el,
        timer: setInterval(updateLoaderFrame, 150),
        frame: 0
      };
      activeLoaders.set(target, loader);

      const img = document.createElement('img');

      el.appendChild(img);

      const isIframe = target.nodeName === 'IFRAME';

      if (isIframe)
        target.parentElement.appendChild(el);
      else
        target.appendChild(el);

      if (instant)
        el.classList.add('visible');
      else
        setTimeout(() => el.classList.add('visible'), 0);

      // Adds instructions after loading for a while
      if (loadingCounter == 0) {
        loader.longTimer = setTimeout(() => {
      	  const loader = activeLoaders.get(target);
      	  if (loader?.element) {
            let loadText = document.createElement('div');
            loadText.style.cssText = "text-align: center; color: white; font-size: 1vw; padding: 1%; position: absolute; bottom: 10%; font-family: 'JF-Dot-Shinonome12';";
        	  loadText.innerHTML = localizedMessages.loadingInstruct;
            loader.element.appendChild(loadText);
      	  }
        }, 30000);
        loadingCounter = 1;
      }

      updateLoader(target);

      updateLoaderFrame();
    });
}

function updateLoader(target) {
  if (activeLoaders.has(target)) {
    const el = activeLoaders.get(target).element;
    fastdom.measure(() => {
      const {offsetTop, offsetLeft, offsetWidth, offsetHeight} = target;
      const scaleX = Math.max(Math.min(Math.floor(offsetWidth / 48), 10), 1);
      const scaleY = Math.max(Math.min(Math.floor(offsetHeight / 64), 10), 1);
      const scale = Math.min(scaleX, scaleY);
      fastdom.mutate(() => {
        el.style.top = `${offsetTop}px`;
        el.style.left = `${offsetLeft}px`;
        el.style.width = `${offsetWidth}px`;
        el.style.height = `${offsetHeight}px`;
        el.children[0].style.transform = `scale(${scale})`;
      });
    });
  }
}

function removeLoader(target) {
  if (activeLoaders.has(target) && activeLoaders.get(target) !== true) {
    const { timer, longTimer, element: el } = activeLoaders.get(target);
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 500);
    clearInterval(timer);
    clearTimeout(longTimer);
  }
  activeLoaders.delete(target);
}

async function getLoaderSpriteImg(sprite, idx, frameIdx, dir) {
  const isBrave = ((navigator.brave && await navigator.brave.isBrave()) || false);
  return new Promise(resolve => {
    const spriteData = loaderSpriteCache;
    if (!spriteData[sprite])
      spriteData[sprite] = {};
    if (!spriteData[sprite][idx])
      spriteData[sprite][idx] = [null, null, null];
    const spriteUrl = spriteData[sprite][idx][frameIdx];
    if (spriteUrl)
      return resolve(spriteUrl);
    const img = new Image();
    img.onload = function () {
      getSpriteImg(img, spriteData, sprite, idx, frameIdx, 24, 32, 0, false, isBrave)
        .then(url => resolve(url));
    };
    if (!dir) {
      dir = `../data/${ynoGameId}/CharSet/`;
      img.onerror = () => getLoaderSpriteImg(sprite, idx, frameIdx, `images/charsets/${ynoGameId}/`).then(url => resolve(url));
    } else {
      img.onerror = () => {
        console.error(`Charset '${sprite}' not found`);
        resolve(null);
      };
    }

    img.src = !sprite?.startsWith('#') ? `${dir}${sprite}.png` : '';
  });
}

(function() {
  addLoader(document.getElementById('loadingOverlay'), true);
})();
