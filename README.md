# SoundFrame — Moodboards Sonoros

Plataforma de descubrimiento cultural basada en atmósferas. En lugar de buscar películas o libros únicamente por géneros tradicionales, permite crear y explorar fichas sensoriales que combinan obras audiovisuales o literarias, paletas de colores extraídas dinámicamente y bandas sonoras con pre-escucha.

## Enlaces en vivo

- **Frontend (Vercel):** https://moodboard-eight-roan.vercel.app
- **Backend API (Render):** https://moodboard-pupu.onrender.com/api/moodboards

## Funcionalidades principales

- **Muro Explorar:** Listado de moodboards con filtros por estado de ánimo (`Melancólico`, `Energético`, `Acogedor`, `Oscuro`, `Nostálgico`, `Épico`, `Relajante`, `Misterioso`), búsqueda y reproducción rápida.
- **Creador de Moodboards:** Búsqueda de películas y libros, extracción de paleta de 5 colores con **ColorThief** (con edición manual), selección de hasta 5 canciones con pre-escucha de 30 segundos y etiquetas de estado de ánimo.
- **Vista Detalle Inmersiva:** Fondo con degradado a partir de la paleta del moodboard y reproductor continuo con paso automático a la siguiente pista.
- **Ruleta de Mood ("Sorpréndeme"):** Selección aleatoria de un moodboard según el estado de ánimo elegido.
- **Perfil y Pasaporte Estético:** Gestión de moodboards creados (editar y eliminar), favoritos y resumen visual de estados de ánimo más frecuentes.

## Stack tecnológico

- **Frontend:** Angular, TypeScript, CSS por componente
- **Backend:** Java, Spring Boot, Spring Data JPA
- **Base de datos:** MySQL
- **Despliegue:** Vercel (frontend) y Render + base de datos MySQL en la nube
- **APIs y librerías externas:** TMDB, Google Books, Deezer (previews de audio) y ColorThief

## Nota sobre autenticación y usuario demo

Actualmente la aplicación utiliza un usuario invitado/demo por defecto (`idUsuario = 1`) para facilitar las pruebas directas sin necesidad de registro previo, quedando el sistema completo de login/registro como evolución posterior.

## Estructura del repositorio

```text
Moodboard/
├── docs/               # Documentación, diagrama ER y script SQL
├── frontend/           # Aplicación web en Angular
├── moodboard-backend/  # API REST en Java Spring Boot
└── README.md
