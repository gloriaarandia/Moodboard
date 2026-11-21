package com.moodboard.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.moodboard.backend.modelo.javabean.User;

public interface UserRepository extends JpaRepository<User, Integer>{

	User findByEmail (String email);
}
