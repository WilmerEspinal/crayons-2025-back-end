-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar roles básicos
INSERT INTO roles (name, description) VALUES
('admin', 'Administrador del sistema'),
('user', 'Usuario regular');

-- Tabla de personas (base para alumnos y docentes)
CREATE TABLE IF NOT EXISTS persona (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    ap_p VARCHAR(100) NOT NULL,
    ap_m VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de alumnos
CREATE TABLE IF NOT EXISTS alumno (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_persona INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES persona(id) ON DELETE CASCADE
);

-- Tabla de docentes
CREATE TABLE IF NOT EXISTS docente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_persona INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES persona(id) ON DELETE CASCADE
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    id_persona INT NOT NULL,
    role_id INT NOT NULL,
    change_password_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (id_persona) REFERENCES persona(id) ON DELETE CASCADE
);

-- Tabla para tokens de refresco
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de justificaciones para PDFs
CREATE TABLE IF NOT EXISTS justificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_alumno INT NOT NULL,
    id_docente INT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_justificacion ENUM('medica', 'personal', 'familiar', 'otro') DEFAULT 'otro',
    url_pdf VARCHAR(500) NOT NULL,
    public_id_cloudinary VARCHAR(255) NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_falta DATE,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL,
    comentario_revision TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_alumno) REFERENCES alumno(id) ON DELETE CASCADE,
    FOREIGN KEY (id_docente) REFERENCES docente(id) ON DELETE SET NULL,
    INDEX idx_alumno (id_alumno),
    INDEX idx_docente (id_docente),
    INDEX idx_estado (estado),
    INDEX idx_fecha_falta (fecha_falta)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_persona_dni ON persona(dni);
CREATE INDEX idx_alumno_persona ON alumno(id_persona);
CREATE INDEX idx_docente_persona ON docente(id_persona); 