-- Modificar tabla asistencia para usar id_docente en lugar de id_docente_curso
USE auth_db;

-- Primero, eliminar la foreign key existente (ajusta el nombre si es diferente)
-- ALTER TABLE asistencia DROP FOREIGN KEY asistencia_ibfk_2;

-- Eliminar la columna id_docente_curso
ALTER TABLE asistencia DROP COLUMN id_docente_curso;

-- Agregar la nueva columna id_docente
ALTER TABLE asistencia ADD COLUMN id_docente INT;

-- Agregar la foreign key para id_docente
ALTER TABLE asistencia ADD FOREIGN KEY (id_docente) REFERENCES docente(id) ON DELETE SET NULL;

-- Agregar índice para mejorar rendimiento
CREATE INDEX idx_asistencia_docente ON asistencia(id_docente); 