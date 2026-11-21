package com.moodboard.backend.modelo.javabean;

import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tags")
public class Tag {

	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_tag")
	private Integer idTag;
	@Column(name = "nombre", nullable = false, unique = true)
	private String nombre;
	
	
	public Tag() {
	}


	public Tag(Integer idTag, String nombre) {
		super();
		this.idTag = idTag;
		this.nombre = nombre;
	}


	@Override
	public String toString() {
		return "Tag [idTag=" + idTag + ", nombre=" + nombre + "]";
	}


	public Integer getIdTag() {
		return idTag;
	}


	public void setIdTag(Integer idTag) {
		this.idTag = idTag;
	}


	public String getNombre() {
		return nombre;
	}


	public void setNombre(String nombre) {
		this.nombre = nombre;
	}


	@Override
	public int hashCode() {
		return Objects.hash(idTag);
	}


	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Tag other = (Tag) obj;
		return Objects.equals(idTag, other.idTag);
	}
	
	
}
