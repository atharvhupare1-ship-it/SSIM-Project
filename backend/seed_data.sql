-- ============================================
-- SSIM Seed Data: Suppliers + Products
-- ============================================

-- Suppliers
INSERT INTO suppliers (name, phone, email, address) VALUES
  ('Cello Pens India', '9876543210', 'sales@cellopens.in', 'Mumbai, Maharashtra'),
  ('Natraj Stationery', '9123456780', 'orders@natraj.com', 'Ahmedabad, Gujarat'),
  ('Classmate (ITC)', '9988776655', 'supply@classmate.in', 'Kolkata, West Bengal'),
  ('Camlin Kokuyo', '9112233445', 'info@camlinkokuyo.com', 'Mumbai, Maharashtra'),
  ('Faber-Castell India', '9001122334', 'contact@faber-castell.in', 'Goa, India')
ON CONFLICT DO NOTHING;

-- Products (uses subqueries to reference categories & suppliers by name)
INSERT INTO products (name, category_id, price, quantity, supplier_id, image_url) VALUES
  -- Pens
  ('Cello Butterflow Blue', (SELECT id FROM categories WHERE name='Pens'), 10.00, 250, (SELECT id FROM suppliers WHERE name='Cello Pens India'), NULL),
  ('Cello Butterflow Black', (SELECT id FROM categories WHERE name='Pens'), 10.00, 200, (SELECT id FROM suppliers WHERE name='Cello Pens India'), NULL),
  ('Cello Gripper Gel Pen', (SELECT id FROM categories WHERE name='Pens'), 25.00, 150, (SELECT id FROM suppliers WHERE name='Cello Pens India'), NULL),
  ('Natraj Use & Throw Pen', (SELECT id FROM categories WHERE name='Pens'), 5.00, 500, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Faber-Castell Ball Pen', (SELECT id FROM categories WHERE name='Pens'), 30.00, 80, (SELECT id FROM suppliers WHERE name='Faber-Castell India'), NULL),

  -- Pencils
  ('Natraj HB Pencil (Pack of 10)', (SELECT id FROM categories WHERE name='Pencils'), 40.00, 300, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Natraj 621 Pencil', (SELECT id FROM categories WHERE name='Pencils'), 3.00, 600, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Faber-Castell 2B Pencil', (SELECT id FROM categories WHERE name='Pencils'), 12.00, 120, (SELECT id FROM suppliers WHERE name='Faber-Castell India'), NULL),
  ('Camlin Mechanical Pencil 0.5mm', (SELECT id FROM categories WHERE name='Pencils'), 45.00, 90, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Faber-Castell Colour Pencils (12 set)', (SELECT id FROM categories WHERE name='Pencils'), 120.00, 60, (SELECT id FROM suppliers WHERE name='Faber-Castell India'), NULL),

  -- Notebooks
  ('Classmate Notebook 180 Pages', (SELECT id FROM categories WHERE name='Notebooks'), 55.00, 200, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),
  ('Classmate Notebook 120 Pages', (SELECT id FROM categories WHERE name='Notebooks'), 40.00, 180, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),
  ('Classmate Spiral Notebook A4', (SELECT id FROM categories WHERE name='Notebooks'), 85.00, 100, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),
  ('Camlin Sketch Book A3', (SELECT id FROM categories WHERE name='Notebooks'), 95.00, 50, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Classmate Drawing Book', (SELECT id FROM categories WHERE name='Notebooks'), 35.00, 150, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),

  -- Paper
  ('JK Copier A4 Paper (500 sheets)', (SELECT id FROM categories WHERE name='Paper'), 350.00, 40, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),
  ('Chart Paper (10 sheets assorted)', (SELECT id FROM categories WHERE name='Paper'), 60.00, 75, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Colour Paper A4 (100 sheets)', (SELECT id FROM categories WHERE name='Paper'), 180.00, 30, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),

  -- Files & Folders
  ('Box File Blue', (SELECT id FROM categories WHERE name='Files & Folders'), 90.00, 45, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Ring Binder A4', (SELECT id FROM categories WHERE name='Files & Folders'), 120.00, 35, (SELECT id FROM suppliers WHERE name='Classmate (ITC)'), NULL),
  ('Envelope Folder (Pack of 5)', (SELECT id FROM categories WHERE name='Files & Folders'), 50.00, 100, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('L-Folder Transparent A4', (SELECT id FROM categories WHERE name='Files & Folders'), 15.00, 200, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),

  -- Art Supplies
  ('Camlin Poster Colours (6 shades)', (SELECT id FROM categories WHERE name='Art Supplies'), 85.00, 70, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Camlin Paint Brush Set (7 pcs)', (SELECT id FROM categories WHERE name='Art Supplies'), 110.00, 40, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Faber-Castell Oil Pastels (25 shades)', (SELECT id FROM categories WHERE name='Art Supplies'), 180.00, 55, (SELECT id FROM suppliers WHERE name='Faber-Castell India'), NULL),
  ('Camlin Wax Crayons (24 shades)', (SELECT id FROM categories WHERE name='Art Supplies'), 70.00, 85, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),

  -- Adhesives
  ('Fevistik Glue Stick 15g', (SELECT id FROM categories WHERE name='Adhesives'), 25.00, 300, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Cello Tape Transparent', (SELECT id FROM categories WHERE name='Adhesives'), 20.00, 250, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Fevicol MR 50g', (SELECT id FROM categories WHERE name='Adhesives'), 30.00, 180, (SELECT id FROM suppliers WHERE name='Camlin Kokuyo'), NULL),
  ('Whitener Pen (Correction Pen)', (SELECT id FROM categories WHERE name='Adhesives'), 18.00, 8, (SELECT id FROM suppliers WHERE name='Cello Pens India'), NULL),

  -- Office Supplies
  ('Kangaro Stapler No.10', (SELECT id FROM categories WHERE name='Office Supplies'), 75.00, 60, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Stapler Pins No.10 (Pack)', (SELECT id FROM categories WHERE name='Office Supplies'), 15.00, 200, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Scissors 7 inch', (SELECT id FROM categories WHERE name='Office Supplies'), 40.00, 90, (SELECT id FROM suppliers WHERE name='Faber-Castell India'), NULL),
  ('Paper Clips (100 pcs)', (SELECT id FROM categories WHERE name='Office Supplies'), 20.00, 150, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Rubber Band Pack 100g', (SELECT id FROM categories WHERE name='Office Supplies'), 25.00, 5, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Sharpener Metal', (SELECT id FROM categories WHERE name='Office Supplies'), 8.00, 3, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Eraser (Natraj Non-Dust)', (SELECT id FROM categories WHERE name='Office Supplies'), 5.00, 400, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL),
  ('Ruler 30cm Plastic', (SELECT id FROM categories WHERE name='Office Supplies'), 10.00, 180, (SELECT id FROM suppliers WHERE name='Natraj Stationery'), NULL);
