package com.moodboard.backend.modelo.javabean;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "moodboards")
public class Moodboard {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_moodboard")
	private Integer idMoodboard;
	@ManyToOne
	@JoinColumn(name = "id_user", nullable = false)
	private User user;
	@Column(name = "titulo", nullable = false)
	private String titulo;
	@Column(name = "descripcion", nullable = false)
	private String descripcion;
	@Column(name = "media_type", nullable = false)
	private String mediaType;
	@Column(name = "media_external_id", nullable = false)
	private String mediaExternalId;
	@Column(name = "cover_url", nullable = false)
	private String coverUrl;
	@Column(name = "media_year", nullable = false)
	private short mediaYear;
	@Column(name = "media_title", nullable = false)
	private String mediaTitle;
	@Column(name = "backdrop_url", nullable = false)
	private String backdropUrl;
	@Column(name = "paleta", nullable = false)
	private String paleta;
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
	
	
	@OneToMany(mappedBy = "moodboard", cascade = CascadeType.ALL)
    private List<Track> tracks = new ArrayList<>();

	@ManyToMany
	@JoinTable(
	    name = "moodboard_tag",                           // 1. Nombre de tu tabla pivote en MySQL
	    joinColumns = @JoinColumn(name = "id_moodboard"), // 2. Columna que apunta a ESTA clase (Moodboard)
	    inverseJoinColumns = @JoinColumn(name = "id_tag") // 3. Columna que apunta a la OTRA clase (Tag)
	)
    private List<Tag> tags = new ArrayList<>();

    @ManyToMany
    @JoinTable(
        name = "saved_moodboards",
        joinColumns = @JoinColumn(name = "id_moodboard"),
        inverseJoinColumns = @JoinColumn(name = "id_user")
    )
    private List<User> savedByUsers = new ArrayList<>();

    
    
    
	public Moodboard() {
	}

	public Moodboard(Integer idMoodboard, User user, String titulo, String descripcion, String mediaType,
			String mediaExternalId, String coverUrl, short mediaYear, String mediaTitle, String backdropUrl,
			String paleta, LocalDateTime createdAt, List<Track> tracks, List<Tag> tags, List<User> savedByUsers) {
		super();
		this.idMoodboard = idMoodboard;
		this.user = user;
		this.titulo = titulo;
		this.descripcion = descripcion;
		this.mediaType = mediaType;
		this.mediaExternalId = mediaExternalId;
		this.coverUrl = coverUrl;
		this.mediaYear = mediaYear;
		this.mediaTitle = mediaTitle;
		this.backdropUrl = backdropUrl;
		this.paleta = paleta;
		this.createdAt = createdAt;
		this.tracks = tracks;
		this.tags = tags;
		this.savedByUsers = savedByUsers;
	}

	@Override
	public String toString() {
		return "Moodboard [idMoodboard=" + idMoodboard + ", user=" + user + ", titulo=" + titulo + ", descripcion="
				+ descripcion + ", mediaType=" + mediaType + ", mediaExternalId=" + mediaExternalId + ", coverUrl="
				+ coverUrl + ", mediaYear=" + mediaYear + ", mediaTitle=" + mediaTitle + ", backdropUrl=" + backdropUrl
				+ ", paleta=" + paleta + ", createdAt=" + createdAt + ", tracks=" + tracks + ", tags=" + tags
				+ ", savedByUsers=" + savedByUsers + "]";
	}

	public Integer getIdMoodboard() {
		return idMoodboard;
	}

	public void setIdMoodboard(Integer idMoodboard) {
		this.idMoodboard = idMoodboard;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public String getTitulo() {
		return titulo;
	}

	public void setTitulo(String titulo) {
		this.titulo = titulo;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public String getMediaType() {
		return mediaType;
	}

	public void setMediaType(String mediaType) {
		this.mediaType = mediaType;
	}

	public String getMediaExternalId() {
		return mediaExternalId;
	}

	public void setMediaExternalId(String mediaExternalId) {
		this.mediaExternalId = mediaExternalId;
	}

	public String getCoverUrl() {
		return coverUrl;
	}

	public void setCoverUrl(String coverUrl) {
		this.coverUrl = coverUrl;
	}

	public short getMediaYear() {
		return mediaYear;
	}

	public void setMediaYear(short mediaYear) {
		this.mediaYear = mediaYear;
	}

	public String getMediaTitle() {
		return mediaTitle;
	}

	public void setMediaTitle(String mediaTitle) {
		this.mediaTitle = mediaTitle;
	}

	public String getBackdropUrl() {
		return backdropUrl;
	}

	public void setBackdropUrl(String backdropUrl) {
		this.backdropUrl = backdropUrl;
	}

	public String getPaleta() {
		return paleta;
	}

	public void setPaleta(String paleta) {
		this.paleta = paleta;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public List<Track> getTracks() {
		return tracks;
	}

	public void setTracks(List<Track> tracks) {
		this.tracks = tracks;
	}

	public List<Tag> getTags() {
		return tags;
	}

	public void setTags(List<Tag> tags) {
		this.tags = tags;
	}

	public List<User> getSavedByUsers() {
		return savedByUsers;
	}

	public void setSavedByUsers(List<User> savedByUsers) {
		this.savedByUsers = savedByUsers;
	}

	@Override
	public int hashCode() {
		return Objects.hash(idMoodboard);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Moodboard other = (Moodboard) obj;
		return Objects.equals(idMoodboard, other.idMoodboard);
	}
	
	
    
    
    
}
