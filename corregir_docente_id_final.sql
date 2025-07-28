-- Corregir todos los docente_id en asistencia
UPDATE asistencia a 
JOIN docente_curso dc ON a.id_docente_curso = dc.id 
SET a.docente_id = dc.id_docente;

-- Verificar el resultado
SELECT a.id, a.id_alumno, a.id_docente_curso, a.docente_id, dc.id_docente, a.fecha
FROM asistencia a
LEFT JOIN docente_curso dc ON a.id_docente_curso = dc.id
ORDER BY a.id; 