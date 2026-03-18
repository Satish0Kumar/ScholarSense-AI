UPDATE students SET is_active = FALSE;

UPDATE students SET is_active = TRUE, parent_email = 'mummidiraju5656@gmail.com' WHERE id IN (SELECT id FROM students WHERE grade = 6 ORDER BY id ASC LIMIT 10);

UPDATE students SET is_active = TRUE, parent_email = 'mummidisatishkumar64@gmail.com' WHERE id IN (SELECT id FROM students WHERE grade = 7 ORDER BY id ASC LIMIT 10);

UPDATE students SET is_active = TRUE, parent_email = 'kumar.mummidi083@gmail.com' WHERE id IN (SELECT id FROM students WHERE grade = 8 ORDER BY id ASC LIMIT 10);

UPDATE students SET is_active = TRUE, parent_email = 'mummidinookaraju1972@gmail.com' WHERE id IN (SELECT id FROM students WHERE grade = 9 ORDER BY id ASC LIMIT 10);

UPDATE students SET is_active = TRUE, parent_email = 'mummidiraju5656@gmail.com' WHERE id IN (SELECT id FROM students WHERE grade = 10 ORDER BY id ASC LIMIT 10);

DELETE FROM notifications;

SELECT grade, COUNT(*) AS active_students, parent_email FROM students WHERE is_active = TRUE GROUP BY grade, parent_email ORDER BY grade;
