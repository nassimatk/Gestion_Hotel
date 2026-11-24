package com.hotel.disponibilites.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Optional;

@Component
public class ChambreClient {

    private record ChambreResponse(
            ChambreInfo data,
            Long id,
            String nom,
            String numero,
            String type,
            Integer capacite
    ) {}

    public record ChambreInfo(
            Long id,
            String nom,
            String numero,
            String type,
            Integer capacite
    ) {}

    private final RestClient restClient;
    private final boolean mock;

    public ChambreClient(@Value("${chambres.service.url}") String baseUrl,
                         @Value("${chambres.mock}") boolean mock) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
        this.mock = mock;
    }

    public boolean existe(Long chambreId) {
        return getChambre(chambreId).isPresent();
    }

    public Optional<Integer> getCapacite(Long chambreId) {
        return getChambre(chambreId)
                .map(info -> info.capacite() != null ? info.capacite() : Integer.MAX_VALUE);
    }

    public Optional<ChambreInfo> getChambre(Long chambreId) {
        if (chambreId == null) {
            return Optional.empty();
        }
        if (mock) {
            return (chambreId >= 1 && chambreId <= 10)
                    ? Optional.of(new ChambreInfo(chambreId, "Chambre " + chambreId, String.valueOf(100 + chambreId), "simple", 4))
                    : Optional.empty();
        }
        try {
            ChambreResponse response = restClient.get()
                    .uri("/chambres/{id}", chambreId)
                    .retrieve()
                    .body(ChambreResponse.class);
            if (response == null) {
                return Optional.empty();
            }
            ChambreInfo info = response.data() != null
                    ? response.data()
                    : (response.id() != null || response.capacite() != null
                    ? new ChambreInfo(response.id(), response.nom(), response.numero(), response.type(), response.capacite())
                    : null);
            return Optional.ofNullable(info);
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Service chambres indisponible");
        }
    }
}