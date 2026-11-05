package br.com.vitaju.api.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "exercise_sessions")
public class ExerciseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String exerciseId;

    @Column(nullable = false, length = 120)
    private String exerciseName;

    @Column(nullable = false)
    private int movementCount;

    @Column(nullable = false)
    private int detectedFrames;

    @Column(nullable = false)
    private int durationSeconds;

    @Column(nullable = false)
    private Instant startedAt;

    protected ExerciseSession() {
    }

    public ExerciseSession(
            String exerciseId,
            String exerciseName,
            int movementCount,
            int detectedFrames,
            int durationSeconds,
            Instant startedAt) {
        this.exerciseId = exerciseId;
        this.exerciseName = exerciseName;
        this.movementCount = movementCount;
        this.detectedFrames = detectedFrames;
        this.durationSeconds = durationSeconds;
        this.startedAt = startedAt;
    }

    public Long getId() {
        return id;
    }

    public String getExerciseId() {
        return exerciseId;
    }

    public String getExerciseName() {
        return exerciseName;
    }

    public int getMovementCount() {
        return movementCount;
    }

    public int getDetectedFrames() {
        return detectedFrames;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public Instant getStartedAt() {
        return startedAt;
    }
}
