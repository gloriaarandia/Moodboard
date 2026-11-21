package com.moodboard.backend.modelo.javabean;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_user")
	private Integer idUsuario;
	@Column(name = "username", nullable = false, unique = true)
	private String username;
	@Column(name = "contrasena", nullable = false)
	private String contrasena;
	@Column(name = "email", nullable = false, unique = true)
	private String email;
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
	
	
	public User() {
	}


	public User(Integer idUsuario, String username, String contrasena, String email, LocalDateTime createdAt) {
		super();
		this.idUsuario = idUsuario;
		this.username = username;
		this.contrasena = contrasena;
		this.email = email;
		this.createdAt = createdAt;
	}


	@Override
	public String toString() {
		return "User [idUsuario=" + idUsuario + ", username=" + username + ", contrasena=" + contrasena + ", email="
				+ email + ", createdAt=" + createdAt + "]";
	}


	public Integer getIdUsuario() {
		return idUsuario;
	}


	public void setIdUsuario(Integer idUsuario) {
		this.idUsuario = idUsuario;
	}


	public String getUsername() {
		return username;
	}


	public void setUsername(String username) {
		this.username = username;
	}


	public String getContrasena() {
		return contrasena;
	}


	public void setContrasena(String contrasena) {
		this.contrasena = contrasena;
	}


	public String getEmail() {
		return email;
	}


	public void setEmail(String email) {
		this.email = email;
	}


	public LocalDateTime getCreatedAt() {
		return createdAt;
	}


	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}


	@Override
	public int hashCode() {
		return Objects.hash(idUsuario);
	}


	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		User other = (User) obj;
		return Objects.equals(idUsuario, other.idUsuario);
	}
	
	
}
