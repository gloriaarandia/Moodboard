package com.moodboard.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.moodboard.backend.modelo.javabean.Tag;

public interface TagRepository extends JpaRepository<Tag, Integer>{

}
