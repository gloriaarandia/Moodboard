package com.moodboard.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.moodboard.backend.modelo.javabean.Moodboard;

public interface MoodboardRepository extends JpaRepository<Moodboard, Integer>{

	List <Moodboard> findByMediaType (String MediaType);
	List <Moodboard> findByTagsNombre (String nombre);
}
