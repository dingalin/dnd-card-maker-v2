import { useCardContext } from '../../store';
import ItemCreationForm from './components/ItemCreationForm';
import CardCanvas from '../../components/Canvas/CardCanvas';
import './CardCreator.css';

// Assets

function CardCreator() {
    const { state } = useCardContext();

    return (
        <div className="card-creator">
            <div className="creator-layout">
                {/* Right Sidebar - Item Creation */}
                <aside className="sidebar sidebar-start">
                    <ItemCreationForm />
                </aside>

                {/* Center - Card Preview */}
                <main className="preview-area">

                    <div className="card-preview">

                        <CardCanvas />

                        {/* Debug info */}
                        {state.cardData && (
                            <div className="debug-info">
                                <small>{state.cardData.front?.title || state.cardData.name}</small>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CardCreator;

