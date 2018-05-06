import * as WebCola from 'webcola';

// Override the Layout so that the ticks are controlled by the render loop.
// The kick() method contains no loop any longer. Instead nextFrame() has to be called
// to continue with the animation.
class Layout extends WebCola.Layout {

  constructor()
  {
    super();

    this.nextFrame = this.nextFrame.bind(this);
  }

  kick() {
    this.tick();
  }

  nextFrame() {
    window.requestAnimationFrame(this.tick.bind(this));
  }
}

export default Layout;
