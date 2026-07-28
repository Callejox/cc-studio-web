# CC Studio — Web

Web del estudio **CC Studio** (diseño web y software a medida para pequeños negocios en España). Sitio estático premium, sin frameworks: HTML + CSS + JavaScript vanilla con animaciones cinematográficas hechas a mano.

🌐 **En producción:** https://www.ccstudioweb.es/

---

## ✨ Qué tiene dentro

- **Hero generativo ligado al scroll:** miles de partículas dibujadas en `<canvas>` convergen formando el logo CC Studio según se scrollea (sin imágenes: el logo se redibuja con las fuentes reales y se muestrean sus píxeles). El titular cruza entre tres fases sincronizadas con el pin.
- **Scroll cinematográfico:** Lenis (scroll suave) + GSAP ScrollTrigger, con parallax en proyectos, reveals por sección y titulares palabra a palabra.
- **Estética "liquid glass":** cristal con borde degradado enmascarado (`mask-composite`) en navegación, tarjetas y CTAs.
- **Baraja 3D de soluciones:** pila isométrica de tarjetas con selección pegajosa anti-parpadeo (los `pointerenter` falsos que provoca el propio movimiento de las cartas se ignoran).
- **Páginas de equipo:** currículums de los fundadores con hero liquid-glass sobre vídeo en bucle ([javier-callejo.html](javier-callejo.html), [barbara-casco.html](barbara-casco.html)).
- **Detalles de producción:** preloader, cursor propio, grano de película en canvas, esfera 3D interactiva, FAQ accesible, formulario PHP con honeypot y RGPD, aviso de cookies con Consent Mode (GA4 + Meta Pixel solo tras aceptar).
- **SEO:** JSON-LD (`ProfessionalService` + ofertas), Open Graph, sitemap, robots.
- **Accesibilidad:** `prefers-reduced-motion` respetado en todos los efectos (el contenido completo sigue disponible sin animaciones).

## 🛠️ Tecnologías

`HTML5` · `CSS3` · `JavaScript (vanilla)` · `GSAP + ScrollTrigger` · `Lenis` · `PHP` (formulario) · sin build ni dependencias de Node

## 📁 Estructura

```
index.html            Página principal
prototipo-cc.css/js   Estilos y motor de animación del sitio (versionados con ?v=N)
javier-callejo.html   CV de Javier (hero liquid-glass + vídeo)
barbara-casco.html    CV de Bárbara (hero liquid-glass + vídeo)
equipo.css            Estilos de las páginas de equipo
enviar.php            Procesado del formulario (mail + honeypot + RGPD)
fonts/  img/  video/  vendor/   Recursos autoalojados (Poppins/Inter, GSAP, Lenis…)
```

## 🚀 Desarrollo en local

```bash
python3 -m http.server 8768
```

y abrir <http://localhost:8768>. (El envío del formulario requiere un hosting con PHP; en local muestra el aviso de respaldo.)

**Caché:** al tocar `prototipo-cc.css/js` o `equipo.css`, sube el `?v=N` en los HTML que los cargan.

---

Hecho por [Javier Callejo](https://github.com/Callejox) y Bárbara Casco — CC Studio.
