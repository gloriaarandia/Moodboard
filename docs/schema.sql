Create database if not exists moodboard;
Use moodboard;

-- Tabla users
Create table if not exists users(
	id_user int auto_increment primary key,
    username varchar(50) not null unique,
    contrasena varchar(100) not null,
    email varchar(255) not null unique,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Tabla moodboards
Create table if not exists moodboards(
	id_moodboard int auto_increment primary key,
    id_user int not null,
    titulo varchar(200) not null,
    descripcion text null,
    media_type enum('pelicula', 'libro') not null,
    media_external_id varchar(100) not null,
    cover_url varchar (500) not null,
    media_year smallint null,
    media_title varchar(100) not null,
    backdrop_url varchar(500) null,
    paleta json null,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    foreign key (id_user) references users(id_user) ON DELETE CASCADE
);

-- Tabla tracks
Create table if not exists tracks(
	id_track int auto_increment primary key,
    id_moodboard int not null,
    titulo varchar(100) not null,
    artista varchar(100) not null,
    album_cover varchar(500) not null,
    deezer_track_id varchar(100) not null,
    preview_mp3_url varchar(500) not null,
    album_titulo varchar(100) not null,
    foreign key (id_moodboard) references moodboards(id_moodboard) ON DELETE CASCADE
);

-- Tabla tags
Create table if not exists tags(
	id_tag int auto_increment primary key,
    nombre varchar(100) not null unique
);

-- Tabla pivote moodboard tag
Create table if not exists moodboard_tag (
	id_moodboard int not null,
    id_tag int not null,
    primary key (id_moodboard, id_tag),
    foreign key (id_moodboard) references moodboards(id_moodboard) ON DELETE CASCADE, 
    foreign key (id_tag) references tags(id_tag) ON DELETE CASCADE
);

-- Tabla pivote saved moodboards
Create table if not exists saved_moodboards (
	id_moodboard int not null,
    id_user int not null,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    primary key (id_moodboard, id_user),
    foreign key (id_moodboard) references moodboards(id_moodboard) ON DELETE CASCADE,
    foreign key (id_user) references users(id_user) ON DELETE CASCADE
);

-- Estados de ánimo
INSERT INTO tags (nombre) VALUES 
('Melancólico'),
('Energético'),
('Acogedor'),
('Oscuro'),
('Nostálgico'),
('Épico'),
('Relajante'),
('Misterioso');