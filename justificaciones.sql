-- Solo la tabla de justificaciones
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