package br.com.vitaju.api.session;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {
    List<ExerciseSession> findTop50ByOrderByStartedAtDesc();
}
