# Proyecto SignUp SignIn in Application

## Información General
Este proyecto consiste en el desarrollo del **lado cliente (Front-End)** de una aplicación web bancaria que permite realizar los siguientes casos de uso:

- **Registro de usuario (Sign Up)**
- **Inicio de sesión (Sign In)**
- **Cambio de contraseña (Change Password)**
-**My Accounts' Create, Update, Read, Delete (CRUD).**
-**My Movements' CRUD.**
-**Customers' CRUD.**

El objetivo es emular la interfaz gráfica de un sistema de autenticación bancaria, comunicándose con un **back-end RESTful** ya proporcionado.  
Este trabajo forma parte de las asignaturas **Diseño de Interfaces Web** y **Desarrollo Web en Entorno Cliente** del ciclo formativo de **Desarrollo de Aplicaciones Web**.

El codigo fuente se encuentra en el siguiente repositorio:
- https://github.com/raulvp003/DigitalBank

## Estructura 

Este repositorio tiene la siguiente estructura de carpetas y archivos:

```
DigitalBank/
├── web/                          # Código fuente de la aplicación
│   ├── index.html               # Página de inicio/bienvenida
│   ├── signUp.html              # Formulario de registro de usuario
│   ├── signIn.html              # Formulario de inicio de sesión
│   ├── main.html                # Dashboard principal de cuentas (usuarios)
│   ├── Account.html             # Detalles de cuenta individual
│   ├── MovementsPage.html       # Página de historial de movimientos
│   ├── customers.html           # Panel de administración de clientes (admin)
│   ├── clases.js                # Clases y modelos de datos compartidos
│   ├── Bank.png                 # Logo del banco
│   │
│   ├── assets/                  # Recursos estáticos
│   │   ├── css/
│   │   │   ├── style.css        # Estilos principales (tema claro)
│   │   │   └── dark-mode.css    # Estilos para modo oscuro
│   │   │
│   │   ├── js/                  # Scripts JavaScript
│   │   │   ├── scriptSignUp.js  # Lógica de registro
│   │   │   ├── scriptSignIn.js  # Lógica de inicio de sesión
│   │   │   ├── customers.js     # Gestión de clientes (CRUD admin)
│   │   │   ├── accounts.js      # Gestión de cuentas
│   │   │   ├── movements.js     # Gestión de movimientos
│   │   │   └── [otros scripts]
│   │   │
│   │   └── h5p-content/         # Contenido multimedia
│   │       ├── h5p.json
│   │       ├── content/         # Vídeos de ayuda
│   │       └── [bibliotecas h5p]
│   │
│   └── WEB-INF/                 # Configuración de la aplicación web
│       └── web.xml              # Descriptor de despliegue
│
├── build/                       # Versión compilada lista para desplegar
│   └── web/                     # Contiene los mismos archivos que /web/
│
├── nbproject/                   # Configuración de NetBeans IDE
│   ├── project.xml
│   ├── project.properties
│   └── [otros archivos de configuración]
│
├── src/                         # Fuentes adicionales (si aplica)
│   └── conf/
│       └── MANIFEST.MF
│
├── build.xml                    # Script de construcción Apache Ant
├── main.html                    # Archivo HTML adicional en raíz
└── README.md                    
```

### Páginas Principales:
- **index.html**: Página de bienvenida con opciones de registro e inicio de sesión
- **signUp.html**: Formulario completo de registro con validaciones
- **signIn.html**: Formulario de autenticación de usuarios
- **main.html**: Dashboard con listado de cuentas del usuario
- **Account.html**: Vista detallada de una cuenta específica
- **MovementsPage.html**: Historial completo de transacciones
- **customers.html**: Panel administrativo para gestión CRUD de clientes al cual solo pueden acceder los administradores 
                    los cuales se definen por su dominio **ejemplo@admin.com**

### Archivos CSS:
- **style.css**: Tema principal con paleta azul corporativa
- **dark-mode.css**: Tema alternativo oscuro para reducir fatiga visual

### Scripts JavaScript:
- **clases.js**: Define las clases Customer, Account, Movement
- **scriptSignUp.js**: Validaciones y registro de nuevos usuarios
- **scriptSignIn.js**: Autenticación y redirección según perfil
- **customers.js**: CRUD completo para gestión de clientes (admin)

- **movements.js**: Gestión de transacciones y movimientos

Nuestras principales tecnologías utilizadas para este proyecto han sido HTML5, CSS3 y JavaScript

## Diseño
Para este diseño hemos decidido usar una plantilla con una gama de colores azul y adecuandose a lo que espera un cliente de una app de banca.Hemos ajustado a este propósito los colores y tipografías.Hemos depurado y testeado el codigo en los principales navegadores de pc y movil.

## Desarrolladores
Este proyecto se ha realizado por:
- Jair Ortiz -Inicio sesión Wp2: Casos de uso Sign In Y WP1: Casos de uso My Accounts' Create, Update, Read, Delete (CRUD).
- Raúl Vera- Crear usuario (WP1 Casos de uso Sign Up) y WP3: Casos de uso Customers' CRUD.
- Eloy Rodríguez-Cambio contraseña (WP3 Casos de uso Change Password) Y WP2: Casos de uso My Movements' CRUD.



