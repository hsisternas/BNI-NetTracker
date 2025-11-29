
# BNI NetTracker

Aplicación web para digitalizar hojas de asistencia de reuniones de networking BNI, extraer solicitudes manuscritas mediante IA (Google Gemini) y gestionar el historial de referencias de los miembros.

## Características

- **Escaneo con IA**: Utiliza Google Gemini 2.5 Flash para leer hojas de asistencia manuscritas.
- **Gestión de Miembros**: Directorio de miembros con su sector y empresa.
- **Historial de Referencias**: Seguimiento semana a semana de lo que pide cada miembro.
- **Resumen Semanal**: Vista rápida de las solicitudes de la última reunión.
- **Multi-usuario Seguro**: Registro y Login independiente para cada grupo/usuario.
- **Panel de Administración**: Aprobación de nuevos usuarios y gestión de permisos.
- **Diseño Responsive**: Funciona en móvil y escritorio.

## Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS.
- **IA**: Google Gemini API (@google/genai).
- **Hosting Recomendado**: Vercel.

## Configuración para Desarrollo Local

1.  Clonar el repositorio.
2.  Esta aplicación está diseñada para funcionar sin un servidor de backend (Serverless/SPA), usando `localStorage` para la persistencia de datos (demo) y API directa a Gemini.
3.  Necesitas una API Key de [Google AI Studio](https://aistudio.google.com/).

## Despliegue en Vercel

1.  Importar este repositorio en Vercel.
2.  Configurar la variable de entorno:
    *   `API_KEY`: Tu clave de API de Google Gemini.
3.  Desplegar.

## Uso

1.  El primer usuario que se registre será el **Administrador**.
2.  Los siguientes usuarios quedarán en estado "Pendiente".
3.  El administrador debe ir a la sección "Aprobar Usuarios" para darles acceso.
