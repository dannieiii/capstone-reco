<template>
    <div v-if="isVisible" class="modal-overlay">
        <div class="modal-content">
            <p>Are you sure you want to delete this product?</p>
            <div class="modal-buttons">
                <button @click="confirmDelete">Yes</button>
                <button @click="cancelDelete">No</button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        isVisible: Boolean,
    },
    emits: ['confirm', 'cancel'],
    methods: {
        confirmDelete() {
            this.$emit('confirm');
        },
        cancelDelete() {
            this.$emit('cancel');
        },
    },
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}

.modal-buttons {
    margin-top: 20px;
}

.modal-buttons button {
    margin: 0 10px;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.modal-buttons button:first-child {
    background-color: #ff4d4d;
    color: white;
}

.modal-buttons button:last-child {
    background-color: #ccc;
}
</style>