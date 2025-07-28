-- Agregar columna docente_id a la tabla asistencia
ALTER TABLE asistencia ADD COLUMN docente_id INT NULL;

-- Agregar índice para mejorar el rendimiento
ALTER TABLE asistencia ADD INDEX idx_docente_id (docente_id);

-- Agregar foreign key constraint
ALTER TABLE asistencia ADD CONSTRAINT fk_asistencia_docente 
FOREIGN KEY (docente_id) REFERENCES docente(id) ON DELETE SET NULL;

-- Actualizar los registros existentes con el docente_id correcto
-- basado en la relación docente_curso
UPDATE asistencia a 
JOIN docente_curso dc ON a.id_docente_curso = dc.id 
SET a.docente_id = dc.id_docente 
WHERE a.docente_id IS NULL; 