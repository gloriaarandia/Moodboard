package com.moodboard.backend.modelo.javabean;

import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tracks")
public class Track {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_track")
	private Integer idTrack;
	@ManyToOne
	@JoinColumn(name = "id_moodboard", nullable = false)
	@JsonIgnore
	private Moodboard moodboard;
	@Column(name = "titulo", nullable = false)
	private String titulo;
	@Column(name = "artista", nullable = false)
	private String artista;
	@Column(name = "album_cover", nullable = false)
	private String albumCover;
	@Column(name = "deezer_track_id", nullable = false)
	private String deezerTrackId;
	@Column(name = "preview_mp3_url", nullable = false)
	private String previewMp3Url;
	@Column(name = "album_titulo", nullable = false)
	private String albumTitulo;
	
	
	public Track() {
	}


	public Track(Integer idTrack, Moodboard moodboard, String titulo, String artista, String albumCover,
			String deezerTrackId, String previewMp3Url, String albumTitulo) {
		super();
		this.idTrack = idTrack;
		this.moodboard = moodboard;
		this.titulo = titulo;
		this.artista = artista;
		this.albumCover = albumCover;
		this.deezerTrackId = deezerTrackId;
		this.previewMp3Url = previewMp3Url;
		this.albumTitulo = albumTitulo;
	}


	@Override
	public String toString() {
		return "Track [idTrack=" + idTrack + ", moodboard=" + moodboard + ", titulo=" + titulo + ", artista=" + artista
				+ ", albumCover=" + albumCover + ", deezerTrackId=" + deezerTrackId + ", previewMp3Url=" + previewMp3Url
				+ ", albumTitulo=" + albumTitulo + "]";
	}


	public Integer getIdTrack() {
		return idTrack;
	}


	public void setIdTrack(Integer idTrack) {
		this.idTrack = idTrack;
	}


	public Moodboard getMoodboard() {
		return moodboard;
	}


	public void setMoodboard(Moodboard moodboard) {
		this.moodboard = moodboard;
	}


	public String getTitulo() {
		return titulo;
	}


	public void setTitulo(String titulo) {
		this.titulo = titulo;
	}


	public String getArtista() {
		return artista;
	}


	public void setArtista(String artista) {
		this.artista = artista;
	}


	public String getAlbumCover() {
		return albumCover;
	}


	public void setAlbumCover(String albumCover) {
		this.albumCover = albumCover;
	}


	public String getDeezerTrackId() {
		return deezerTrackId;
	}


	public void setDeezerTrackId(String deezerTrackId) {
		this.deezerTrackId = deezerTrackId;
	}


	public String getPreviewMp3Url() {
		return previewMp3Url;
	}


	public void setPreviewMp3Url(String previewMp3Url) {
		this.previewMp3Url = previewMp3Url;
	}


	public String getAlbumTitulo() {
		return albumTitulo;
	}


	public void setAlbumTitulo(String albumTitulo) {
		this.albumTitulo = albumTitulo;
	}


	@Override
	public int hashCode() {
		return Objects.hash(idTrack);
	}


	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Track other = (Track) obj;
		return Objects.equals(idTrack, other.idTrack);
	}
	
	
	
	
}
