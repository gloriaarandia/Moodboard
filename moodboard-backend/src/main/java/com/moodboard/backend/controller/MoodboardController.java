package com.moodboard.backend.controller;


import com.moodboard.backend.modelo.javabean.Moodboard;
import com.moodboard.backend.modelo.javabean.Tag;
import com.moodboard.backend.modelo.javabean.Track;
import com.moodboard.backend.modelo.javabean.User;
import com.moodboard.backend.repository.MoodboardRepository;
import com.moodboard.backend.repository.TagRepository;
import com.moodboard.backend.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/moodboards")
@CrossOrigin(origins = "*")
public class MoodboardController {

	@Autowired
    private MoodboardRepository moodboardRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TagRepository tagRepository;

    // 1. LISTAR CON FILTROS: GET /api/moodboards?tag=Melancólico o ?type=libro
    @GetMapping
    public List<Moodboard> listar(
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String type) {
        if (tag != null) {
            return moodboardRepository.findByTagsNombre(tag);
        }
        if (type != null) {
            return moodboardRepository.findByMediaType(type);
        }
        return moodboardRepository.findAll();
    }

    // 2. RULETA DE MOOD: GET /api/moodboards/random?tag=Acogedor
    @GetMapping("/random")
    public ResponseEntity<?> aleatorio(@RequestParam(required = false) String tag) {
        List<Moodboard> lista = (tag != null)
                ? moodboardRepository.findByTagsNombre(tag)
                : moodboardRepository.findAll();

        if (lista.isEmpty()) {
            return ResponseEntity.status(404).body("No hay moodboards para ese estado de ánimo");
        }
        Moodboard elegido = lista.get(new Random().nextInt(lista.size()));
        return ResponseEntity.ok(elegido);
    }

    // 3. CREAR MOODBOARD: POST /api/moodboards
    @PostMapping
    public Moodboard crear(@RequestBody Moodboard nuevoMoodboard) {
        if (nuevoMoodboard.getTracks() != null) {
            for (Track cancion : nuevoMoodboard.getTracks()) {
                cancion.setMoodboard(nuevoMoodboard);
            }
        }
        return moodboardRepository.save(nuevoMoodboard);
    }

    // 4. GUARDAR / QUITAR DE FAVORITOS: POST /api/moodboards/{id}/save?idUser=1
    @PostMapping("/{id}/save")
    public ResponseEntity<?> guardarFavorito(@PathVariable Integer id, @RequestParam Integer idUser) {
        Moodboard mb = moodboardRepository.findById(id).orElse(null);
        User user = userRepository.findById(idUser).orElse(null);

        if (mb == null || user == null) {
            return ResponseEntity.badRequest().body("Moodboard o usuario no encontrado");
        }

        if (mb.getSavedByUsers().contains(user)) {
            mb.getSavedByUsers().remove(user);
            moodboardRepository.save(mb);
            return ResponseEntity.ok("Eliminado de favoritos");
        } else {
            mb.getSavedByUsers().add(user);
            moodboardRepository.save(mb);
            return ResponseEntity.ok("Guardado en favoritos");
        }
    }
	
 // 5. OBTENER UN MOODBOARD POR ID: GET /api/moodboards/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Integer id) {
        return moodboardRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Moodboard no encontrado"));
    }
    
 // 6. ACTUALIZAR MOODBOARD: PUT /api/moodboards/{id}
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @RequestBody Map<String, Object> datosActualizados) {
        try {
            Moodboard mb = moodboardRepository.findById(id).orElse(null);
            if (mb == null) {
                return ResponseEntity.status(404).body("Moodboard no encontrado");
            }

            Object tituloObj = datosActualizados.get("titulo");
            if (tituloObj != null && !tituloObj.toString().isBlank()) {
                mb.setTitulo(tituloObj.toString().trim());
            }

            if (datosActualizados.containsKey("descripcion")) {
                Object descObj = datosActualizados.get("descripcion");
                mb.setDescripcion(descObj != null ? descObj.toString() : null);
            }

            if (datosActualizados.containsKey("paleta") && datosActualizados.get("paleta") != null) {
                mb.setPaleta(datosActualizados.get("paleta").toString());
            }

            if (datosActualizados.get("tags") instanceof List<?> tagsList) {
                mb.getTags().clear();
                for (Object item : tagsList) {
                    if (item instanceof Map<?, ?> tagMap && tagMap.get("idTag") != null) {
                        Integer idTag = ((Number) tagMap.get("idTag")).intValue();
                        tagRepository.findById(idTag).ifPresent(mb.getTags()::add);
                    }
                }
            }

            if (datosActualizados.get("tracks") instanceof List<?> tracksList && !tracksList.isEmpty()) {
                mb.getTracks().clear();
                for (Object item : tracksList) {
                    if (item instanceof Map<?, ?> tMap) {
                        Track cancion = new Track();
                        cancion.setIdTrack(null);
                        cancion.setDeezerTrackId(tMap.get("deezerTrackId") != null ? tMap.get("deezerTrackId").toString() : "");
                        cancion.setTitulo(tMap.get("titulo") != null ? tMap.get("titulo").toString() : "");
                        cancion.setArtista(tMap.get("artista") != null ? tMap.get("artista").toString() : "");
                        cancion.setAlbumTitulo(tMap.get("albumTitulo") != null ? tMap.get("albumTitulo").toString() : "");
                        cancion.setAlbumCover(tMap.get("albumCover") != null ? tMap.get("albumCover").toString() : "");
                        cancion.setPreviewMp3Url(tMap.get("previewMp3Url") != null ? tMap.get("previewMp3Url").toString() : "");
                        cancion.setMoodboard(mb);
                        mb.getTracks().add(cancion);
                    }
                }
            }

            Moodboard guardado = moodboardRepository.save(mb);
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al actualizar: " + e.getMessage());
        }
    }
    
 // 7. ELIMINAR MOODBOARD: DELETE /api/moodboards/{id}
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        try {
            Moodboard mb = moodboardRepository.findById(id).orElse(null);
            if (mb == null) {
                return ResponseEntity.status(404).body("Moodboard no encontrado");
            }

            mb.getTags().clear();
            mb.getSavedByUsers().clear();
            moodboardRepository.saveAndFlush(mb);

            moodboardRepository.delete(mb);
            return ResponseEntity.ok("Moodboard eliminado");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al eliminar: " + e.getMessage());
        }
    }
}
