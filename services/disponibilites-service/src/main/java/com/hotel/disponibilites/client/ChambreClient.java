
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

    private record ChambreInfo(Long id, Integer capacite) {}

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
        return getCapacite(chambreId).isPresent();
    }

    public Optional<Integer> getCapacite(Long chambreId) {
        if (mock) {
            return (chambreId >= 1 && chambreId <= 10)
                    ? Optional.of(4)
                    : Optional.empty();
        }
        try {
            ChambreInfo info = restClient.get()
                    .uri("/chambres/{id}", chambreId)
                    .retrieve()
                    .body(ChambreInfo.class);
            if (info == null) {
                return Optional.empty();
            }
            return Optional.of(info.capacite() != null ? info.capacite() : Integer.MAX_VALUE);
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Service chambres indisponible");
        }
    }
}