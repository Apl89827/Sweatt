const burger = document.getElementById('nav-burger');
const mobileNav = document.getElementById('nav-mobile');
burger.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
