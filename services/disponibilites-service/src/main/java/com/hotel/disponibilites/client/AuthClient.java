package com.hotel.disponibilites.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Optional;

@Component
public class AuthClient {

    public record UserInfo(
            Long id,
            String name,
            String email,
            String role
    ) {}

    private final RestClient restClient;
    private final boolean mock;

    public AuthClient(@Value("${auth.service.url:http://localhost:8005/api}") String baseUrl,
                      @Value("${auth.mock:true}") boolean mock) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
        this.mock = mock;
    }

    public Optional<UserInfo> getUser(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        if (mock) {
            return Optional.of(new UserInfo(userId, "Client #" + userId, null, "client"));
        }
        try {
            UserInfo user = restClient.get()
                    .uri("/users/{id}", userId)
                    .retrieve()
                    .body(UserInfo.class);
            return Optional.ofNullable(user);
        } catch (RestClientException e) {
            // Fallback silencieux : ne bloque pas /api/reservations si auth-service est indisponible
            return Optional.empty();
        }
    }
}