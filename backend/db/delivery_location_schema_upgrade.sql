CREATE TABLE IF NOT EXISTS delivery_agent_locations (
  delivery_agent_id INT UNSIGNED NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(8,2) DEFAULT NULL,
  recorded_at DATETIME NOT NULL,
  PRIMARY KEY (delivery_agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
