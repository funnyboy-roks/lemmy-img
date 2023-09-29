<script lang="ts">
    import { modal } from '../stores';

    const close = () => {
        $modal = 'none';
    };
</script>

<div class="overlay" on:click={close}></div>

<style>
    .overlay {
        position: fixed;
        left: 0;
        top: 0;
        background: #222a;
        width: 100vw;
        height: 100vh;
    }
</style>
