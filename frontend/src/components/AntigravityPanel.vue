<template>
  <div :class="['antigravity-panel', isModal ? 'modal-mode' : 'panel-mode']">
    <div class="panel-header">
      <div class="title">
        <span class="icon">🚀</span>
        <h3>Antigravity Settings</h3>
      </div>
      <button v-if="configurable" class="toggle-btn" @click="toggleMode">
        {{ isModal ? 'Dock to Side' : 'Pop Out' }}
      </button>
    </div>

    <div class="panel-body">
      <div class="setting-group">
        <label>CPU Limit (e.g. 0.5, 2.0)</label>
        <input type="text" v-model="cpus" placeholder="Unlimited" class="premium-input" />
      </div>

      <div class="setting-group">
        <label>Memory Limit (e.g. 512M, 1G)</label>
        <input type="text" v-model="mem_limit" placeholder="Unlimited" class="premium-input" />
      </div>

      <div class="setting-group switch-group">
        <label>Network Isolation</label>
        <label class="switch">
          <input type="checkbox" v-model="network_isolate">
          <span class="slider round"></span>
        </label>
      </div>
    </div>

    <div class="panel-footer">
      <button class="btn-suspend" @click="suspendStack">Suspend Stack</button>
      <button class="btn-apply" @click="applyConstraints">Apply Constraints</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { socket } from '../util-frontend';

const props = defineProps({
  stackName: {
    type: String,
    required: true
  },
  configurable: {
    type: Boolean,
    default: true
  }
});

const isModal = ref(false);
const cpus = ref('');
const mem_limit = ref('');
const network_isolate = ref(false);
const toast = useToast();

const toggleMode = () => {
  isModal.value = !isModal.value;
};

const applyConstraints = () => {
  socket.emit('antigravityApply', props.stackName, {
    cpus: cpus.value || undefined,
    mem_limit: mem_limit.value || undefined,
    network_isolate: network_isolate.value
  }, (response) => {
    if (response.ok) {
      toast.success('Constraints applied successfully.');
    } else {
      toast.error('Failed to apply constraints.');
    }
  });
};

const suspendStack = () => {
  socket.emit('antigravitySuspend', props.stackName, (response) => {
    if (response.ok) {
      toast.warning('Stack suspended.');
    } else {
      toast.error('Failed to suspend stack.');
    }
  });
};
</script>

<style scoped>
.antigravity-panel {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #f8fafc;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 400px;
}

.modal-mode {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  border: 1px solid rgba(147, 197, 253, 0.3);
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.2), 0 20px 40px rgba(0,0,0,0.6);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 12px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(to right, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.icon {
  font-size: 1.5rem;
}

.toggle-btn {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #334155;
  color: #f8fafc;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.setting-group label {
  font-size: 0.875rem;
  color: #cbd5e1;
  font-weight: 500;
}

.premium-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  outline: none;
}

.premium-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.switch-group {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #334155;
  transition: .4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}
input:checked + .slider {
  background-color: #8b5cf6;
}
input:focus + .slider {
  box-shadow: 0 0 1px #8b5cf6;
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}

.panel-footer {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

button {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-suspend {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-suspend:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.btn-apply {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-apply:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}
</style>
