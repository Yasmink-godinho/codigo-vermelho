package com.codigovermelho.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class AnaliseThreadPoolConfig {

    @Bean(destroyMethod = "shutdown")
    public ExecutorService analiseExecutorService() {
        return Executors.newFixedThreadPool(8);
    }
}