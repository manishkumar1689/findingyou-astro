export const exitFullScreen = () => {
  document.body.classList.remove("fullscreen");
  if (document.exitFullscreen && document.fullscreen) {
    document.exitFullscreen();
  }
};

export const toggleFullScreen = (element: HTMLElement) => {
  if (!document.fullscreenElement) {
    element.requestFullscreen();
    document.body.classList.add("fullscreen");
  } else {
    exitFullScreen();
  }
};

export const assignAspectClass = (windowSize: {
  width: number;
  height: number;
}) => {
  const { width, height } = windowSize;
  if (width > 200 && height > 200) {
    const bc = document.body.classList;
    bc.forEach((c) => {
      if (c.indexOf("aspect-") === 0) {
        bc.remove(c);
      }
    });
    const aspectRatio = width / height;
    let aspectCl = "aspect-square";
    if (aspectRatio > 2) {
      aspectCl = "aspect-wide-2-1";
    } else if (aspectRatio > 1.6667) {
      aspectCl = "aspect-wide-16-9";
    } else if (aspectRatio > 1.475) {
      aspectCl = "aspect-landscape-3-2";
    } else if (aspectRatio > 1.3) {
      aspectCl = "aspect-landscape-4-3";
    } else if (aspectRatio > 1.2) {
      aspectCl = "aspect-landscape-5-4";
    } else if (aspectRatio < 0.5) {
      aspectCl = "aspect-tall-1-2";
    } else if (aspectRatio < 0.6) {
      aspectCl = "aspect-tall-9-16";
    } else if (aspectRatio < 0.678) {
      aspectCl = "aspect-portrait-2-3";
    } else if (aspectRatio < 0.7692) {
      aspectCl = "aspect-portrait-3-4";
    } else if (aspectRatio < 0.83333) {
      aspectCl = "aspect-portrait-4-5";
    }
    bc.add(aspectCl);
  }
};
